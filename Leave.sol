pragma solidity ^0.4.0;

/**
 * Leave Contract
 */
contract Leave {

	//address of the account used to deploy contract 
	//this account will be given to admin of the system
	address public admin;

	enum statusChoices {
		APPLIED,
		APPROVED,
		REJECTED
	}

	struct user{
		string id;
		address account;
		uint noOfLeaves;
		bool exists;
	}

	struct leaveApplication {
		// address of aplicant
		address applicant;

		//Leave is applied for both dates inclusive
		uint startDate;
		uint endDate;

		//status of leave
		statusChoices status;
	}

	mapping(address => user) public users;
	leaveApplication[] public leaves;

	constructor() public {
		admin = msg.sender;
		users[admin] = user({
				id : "admin@iitj.ac.in",
				account : admin,
				noOfLeaves: 0,
				exists: true
			});

	}	
	//////////////////////////////////////////////////////////////////////////////////////////////
	function strConcat(string _a, string _b, string _c, string _d, string _e) internal pure returns (string){
	    bytes memory _ba = bytes(_a);
	    bytes memory _bb = bytes(_b);
	    bytes memory _bc = bytes(_c);
	    bytes memory _bd = bytes(_d);
	    bytes memory _be = bytes(_e);
	    string memory abcde = new string(_ba.length + _bb.length + _bc.length + _bd.length + _be.length);
	    bytes memory babcde = bytes(abcde);
	    uint k = 0;
	    for (uint i = 0; i < _ba.length; i++) babcde[k++] = _ba[i];
	    for (i = 0; i < _bb.length; i++) babcde[k++] = _bb[i];
	    for (i = 0; i < _bc.length; i++) babcde[k++] = _bc[i];
	    for (i = 0; i < _bd.length; i++) babcde[k++] = _bd[i];
	    for (i = 0; i < _be.length; i++) babcde[k++] = _be[i];
	    return string(babcde);
	}

	function strConcat(string _a, string _b, string _c, string _d) internal pure returns (string) {
	    return strConcat(_a, _b, _c, _d, "");
	}

	function strConcat(string _a, string _b, string _c) internal pure returns (string) {
	    return strConcat(_a, _b, _c, "", "");
	}

	function strConcat(string _a, string _b) internal pure returns (string) {
	    return strConcat(_a, _b, "", "", "");
	}

	function uint2str(uint i) internal pure returns (string){
	    if (i == 0) return "0";
	    uint j = i;
	    uint length;
	    while (j != 0){
	        length++;
	        j /= 10;
	    }
	    bytes memory bstr = new bytes(length);
	    uint k = length - 1;
	    while (i != 0){
	        bstr[k--] = byte(48 + i % 10);
	        i /= 10;
	    }
	    return string(bstr);
	}

	function bytes32ToString (bytes32 data) internal pure returns (string) {
	    bytes memory bytesString = new bytes(32);
	    for (uint j=0; j<32; j++) {
	        byte char = byte(bytes32(uint(data) * 2 ** (8 * j)));
	        if (char != 0) {
	            bytesString[j] = char;
	        }
	    }
	    return string(bytesString);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////

	function userExists(address x) public view returns (bool) {
		return users[x].exists;
	}

	function approveLeave(uint idx) public returns (bool) {
		if(msg.sender != admin)return false;
		else if (leaves[idx].status != statusChoices.APPLIED) return false;
		leaves[idx].status = statusChoices.APPROVED;
		return true;
	}

	function rejectLeave(uint idx) public returns (bool) {
		if(msg.sender != admin)return false;
		else if (leaves[idx].status != statusChoices.APPLIED) return false;
		leaves[idx].status = statusChoices.REJECTED;
		return true;
	}

	function createAccount(string _id) public returns (bool){
		if(userExists(msg.sender))return false;
		users[msg.sender] = user({
				id : _id,
				account : msg.sender,
				noOfLeaves: 0,
				exists: true
			});
		return true;
	}

	function applyForLeave(uint256 _startDate, uint256 _endDate) public returns (bool) {
		if(userExists(msg.sender) == false)return false;
		leaves.push(leaveApplication({
			applicant : msg.sender,
			startDate : _startDate,
			endDate : _endDate,
			status : statusChoices.APPLIED
		}));
		users[msg.sender].noOfLeaves++;
		return true;
	}

	function getAllLeaves() public view returns (bool, address[] memory,uint[] memory,uint[] memory,statusChoices[] memory) {
		uint siz = leaves.length;
		address[] memory tempAddress = new address[](siz);
		uint[] memory tempStartDate = new uint[](siz);
		uint[] memory tempEndDate = new uint[](siz);
		statusChoices[] memory tempStatusChoices = new statusChoices[](siz);
		if (msg.sender != admin) {
			return (false,tempAddress,tempStartDate,tempEndDate,tempStatusChoices);
		}
		for (uint i=0;i<siz;i++){
			tempAddress[i]=leaves[i].applicant;
			tempStartDate[i]=leaves[i].startDate;
			tempEndDate[i]=leaves[i].endDate;
			tempStatusChoices[i]=leaves[i].status;
		}
		return (true,tempAddress,tempStartDate,tempEndDate,tempStatusChoices);
	}

	function showLeave(uint i) public view returns (bool, address , uint , uint , statusChoices) {
		uint temp1;
		address temp2;
		if(i>=leaves.length)return (false,temp2,temp1,temp1,statusChoices.APPLIED);
		return (true,leaves[i].applicant,leaves[i].startDate,leaves[i].endDate,leaves[i].status);
	}

	function getMyLeaves() public view returns (bool, address[] memory,uint[] memory,uint[] memory,statusChoices[] memory) {
		uint siz = users[msg.sender].noOfLeaves;
		address[] memory tempAddress = new address[](siz);
		uint[] memory tempStartDate = new uint[](siz);
		uint[] memory tempEndDate = new uint[](siz);
		statusChoices[] memory tempStatusChoices = new statusChoices[](siz);
		if(siz==0)return (false,tempAddress,tempStartDate,tempEndDate,tempStatusChoices);
		uint ct=0;
		siz = leaves.length;
		for (uint i=0;i<siz;i++){
			if(leaves[i].applicant == msg.sender){
				tempAddress[ct]=leaves[i].applicant;
				tempStartDate[ct]=leaves[i].startDate;
				tempEndDate[ct]=leaves[i].endDate;
				tempStatusChoices[ct]=leaves[i].status;
				ct++;	
			}
		}
		return (true,tempAddress,tempStartDate,tempEndDate,tempStatusChoices);

		// uint[] memory ans = new uint[](users[msg.sender].noOfLeaves);
		// uint siz = leaves.length;
		// uint ct=0;
		// for (uint i=0;i<siz;i++){
		// 	if(leaves[i].applicant == msg.sender){
		// 		ans[ct++]=i;
		// 	}
		// }
		// return ans;
	}

}

