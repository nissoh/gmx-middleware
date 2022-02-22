// SPDX-License-Identifier: MIT

import "@gambitdao/gmx-contracts/contracts/libraries/math/SafeMath.sol";
import "@gambitdao/gmx-contracts/contracts/libraries/utils/ReentrancyGuard.sol";
import "@gambitdao/gmx-contracts/contracts/peripherals/Reader.sol";
import "@gambitdao/gmx-contracts/contracts/core/interfaces/IRouter.sol";
import "@gambitdao/gmx-contracts/contracts/core/interfaces/IVault.sol";
import "@gambitdao/gmx-contracts/contracts/libraries/token/IERC20.sol";
import "@gambitdao/gmx-contracts/contracts/libraries/token/SafeERC20.sol";

import "./interfaces/IUniswapV2Router.sol";

import "hardhat/console.sol";

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

/*todo can only follow one master with one indextoken ? */

contract TradeGmx is ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    Reader readerContract;

    address public gov;
    address public keeper;

    struct GetPosition {
        uint256 size;
        uint256 collateral;
        uint256 price;
        uint256 lastIncrease;
    }

    struct Position {
        uint256 positionInUsd;
        uint256 collateralInUsd;
        uint256 averagePrice;
        uint256 entryFundingRage;
        uint256 reserveAmount;
        uint256 realisedPnl;
        bool hasProfit;
        uint256 lastIncreasedTime;
    }

    struct IncreasePositionSt {
        IVault vault;
        address puppet;
        address collateralToken;
        address indexToken;
        uint256 size;
        uint256 collateral;
        bool isLong;
        address vaultAddress;
        uint256 leverage;
        uint256 price;
    }

    struct DecreasePositionSt {
        IVault vault;
        address puppet;
        address collateralToken;
        address indexToken;
        uint256 size;
        uint256 collateral;
        bool isLong;
        address vaultAddress;        
        uint256 price;
        address receiver;
    }

    struct Follows {
        address puppet;
        address master;
        bool isFollowing;
    }

    struct MirrorTrade {
        //INDEX IN FOLLOWS ARRAY
        uint256 index;
        address puppet;
        address master;
        bool isActive;
        uint256 startedFollowingTime;
    }

    struct PuppetTrader {
        //INDEX IN ACCOUNTS ARRAY
        uint256 index;
        uint256 gmxIndex;
        uint256 joinedDate;
        //MAPS ADDRESS OF MASTER to MirrorTrade
        address[] followedMasters;
        mapping(address => MirrorTrade) mirrorTrades;
    }
    //MIRROR POSITION MAPPINGS PUPPET FORLLOWING => MASTER
    mapping(address => PuppetTrader) public mirrorPositions;

    //KEEPS TRACK OF ALL ACTIVE FOLLOWS
    Follows[] public followsArray;

    //KEEP TRACK OF ALL PUPPET ACCOUNTS
    address[] public puppetAccounts;

    event FollowingTrader(
        address puppet,
        address master,
        bool isActive,
        uint256 startedFollowingTime
    );

    event IncreasePosition(
        bytes32 typeOfCaller,
        address _caller,
        address collateralToken,
        address indexToken,
        uint256 collateralDelta, //(sizeDelta/collateralDelta) * X Amount
        uint256 sizeDelta,
        bool isLong,
        uint256 price,
        uint256 lastIncreasedTime
    );

    event DecreasePosition(
        bytes32 typeOfCaller,
        address _caller,
        address collateralToken,
        address indexToken,
        uint256 collateralDelta, //(sizeDelta/collateralDelta) * X Amount
        uint256 sizeDelta,
        bool isLong,
        uint256 price,
        uint256 lastIncreasedTime,
        address receiver
    );

    event LiquidatePosition(
        bytes32 key,
        address account,
        address collateralToken,
        address indexToken,
        bool isLong,
        uint256 size,
        uint256 collateral,
        uint256 reserveAmount,
        int256 realisedPnl,
        uint256 markPrice
    );

    event unFollowingTrader(
        address puppet,
        address master,
        bool isActive,
        uint256 unFollowingTime
    );

    modifier onlyGov() {
        require(msg.sender == gov, "MirrorTading: forbidden");
        _;
    }

    modifier onlyKeeper() {
        require(msg.sender == keeper, "MirrorTading: forbidden");
        _;
    }

    constructor(address _readerAddress) public {
        keeper = msg.sender;
        gov = msg.sender;
        readerContract = Reader(_readerAddress);
    }

    function setGov(address _gov) external onlyGov {
        gov = _gov;
    }

    /// @notice Function that maps the puppet to the master, it'll keep track of the master that the puppet wants to follow
    /// @dev Any address can call it
    /// @param _master The trader that is being followed
    function followTrader(address _master) external {
        address _puppet = msg.sender;
        PuppetTrader storage puppet = mirrorPositions[_puppet];

        address checkIfFollowingMaster = puppet.mirrorTrades[_master].master;
        uint256 checkIfUserHasBeenAlreadyAdded = puppet.joinedDate;
        bool notFollowingMaster = checkIfFollowingMaster ==
            0x0000000000000000000000000000000000000000
            ? true
            : false;

        require(notFollowingMaster, "Mirror: Already Following this master");

        puppet.joinedDate = now;
        puppet.mirrorTrades[_master].puppet = _puppet;
        puppet.mirrorTrades[_master].master = _master;
        puppet.mirrorTrades[_master].isActive = true;
        puppet.mirrorTrades[_master].startedFollowingTime = now;
        puppet.followedMasters.push(_master);

        followsArray.push(
            Follows({puppet: _puppet, master: _master, isFollowing: true})
        );

        puppet.mirrorTrades[_master].index = followsArray.length - 1;

        if (checkIfUserHasBeenAlreadyAdded == 0) {
            puppetAccounts.push(_puppet);
        }

        emit FollowingTrader(_puppet, _master, true, now);
    }

    /// @notice Function that gets all puppets
    /// @dev Any address can call it
    function getPuppets() public view returns (address[] memory) {
        return puppetAccounts;
    }

    /// @notice Function that gets one puppets
    /// @dev Any address can call it
    function getPuppet(address _puppet) public view returns (uint256) {
        return (mirrorPositions[_puppet].joinedDate);
    }

    /// @notice Function that gets one puppets
    /// @dev Any address can call it
    function getAllFollows() public view returns (Follows[] memory) {
        return followsArray;
    }

    /// @notice Function to unfollow a master
    /// @dev Any address can call it
    /// @param _master The trader will be unfollowed
    function unFollow(address _master) external {
        address _puppet = msg.sender;
        PuppetTrader storage puppet = mirrorPositions[_puppet];
        uint256 followIndex = puppet.mirrorTrades[_master].index;
        followsArray[followIndex].isFollowing = false;
        emit unFollowingTrader(_puppet, _master, false, now);

        //todo DELETE FROM POSITION AS WELL
        //todo check if there's any current position ...
        //todo check if the position can be liquidated ....
    }

    /// @notice Function to check status of a follow
    /// @dev Any address can call it
    /// @param _master The trader to check against
    function getIfFollowing(address _master) public view returns (bool) {
        address _puppet = msg.sender;
        PuppetTrader storage puppet = mirrorPositions[_puppet];
        uint256 followIndex = puppet.mirrorTrades[_master].index;
        bool isFollowing = followsArray[followIndex].isFollowing;
        return isFollowing;
    }

    /// @notice Function to check status of a follow
    /// @dev Any address can call it
    /// @param _master The trader to check against
    function getIfFollowingMasterAndActive(address _master, address _puppet)
        public
        view
        returns (bool)
    {
        address _puppetAddress = _puppet;
        PuppetTrader storage puppet = mirrorPositions[_puppetAddress];
        bool isActive = puppet.mirrorTrades[_master].isActive;
        return isActive;
    }

    function puppetExists(address _puppet) public view returns (bool) {
        PuppetTrader storage entry = mirrorPositions[_puppet];
        return _contains(entry);
    }

    function _contains(PuppetTrader memory _entry) private pure returns (bool) {
        return _entry.joinedDate > 0;
    }

    function getMasterPositions(
        address _master,
        address _vault,
        address[] memory _collateralTokens,
        address[] memory _indexTokens,
        bool[] memory _isLong
    ) public view returns (uint256[] memory) {
        uint256[] memory positions = readerContract.getPositions(
            _vault,
            _master,
            _collateralTokens,
            _indexTokens,
            _isLong
        );
        return positions;
    }

    function getBalanceOf(address _user, address _token)
        private
        view
        returns (uint256)
    {
        uint256 balanceOf = IERC20(_token).balanceOf(_user);
        return balanceOf;
    }

    function getVaultPosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        IVault _vault
    ) private view returns (GetPosition memory) {
        (
            uint256 size,
            uint256 collateral,
            uint256 price,
            ,
            ,
            ,
            ,
            uint256 lastIncreasedTime
        ) = _vault.getPosition(
                _account,
                _collateralToken,
                _indexToken,
                _isLong
            );
        GetPosition memory getPosition = GetPosition({
            size: size,
            collateral: collateral,
            price: price,
            lastIncrease: lastIncreasedTime
        });
        return getPosition;
    }

    function _convertToTokenDecimals(uint256 _amount, uint256 _price, uint256 _tokenDecimals) private pure returns(uint256){
        return  _amount.div(_price).mul(10**_tokenDecimals);
    }

    function _puppetCollateralCalculation(address _account, address _collateralToken, uint256 _tokenDecimals, uint256 _price, uint256 _leverage) private view returns(uint256, uint256, uint256){
        uint256 totalBalanceOfCollateral = getBalanceOf(_account, _collateralToken);
        uint256 totalBalanceOfCollateralUSD = totalBalanceOfCollateral.div(10**_tokenDecimals).mul(_price);
        uint256 leveragedTotalCollateralUSD = totalBalanceOfCollateralUSD.mul(_leverage);
        return (totalBalanceOfCollateral, totalBalanceOfCollateralUSD, leveragedTotalCollateralUSD);
    }

    function _increasePosition(
        IncreasePositionSt memory position
    ) private {
        uint256 tokenDecimals = position.vault.tokenDecimals(position.collateralToken);
        (uint256 totalBalanceOfCollateral,
        uint256 totalBalanceOfCollateralUSD,
        uint256 leveragedTotalCollateralUSD
        ) = _puppetCollateralCalculation(position.puppet, position.collateralToken, tokenDecimals, position.price, position.leverage);
        //TOTAL ALLOWED LEVERAGED POSITION        
        uint256 size = position.size;
        uint256 collateralMasterWDecimals = _convertToTokenDecimals(position.collateral, position.price, tokenDecimals);


        if(totalBalanceOfCollateralUSD > position.collateral){ 
            //FOLLOW MASTER'S COLLATERAL IF PUPPET'S COLLATERAL AVAILABLE IS BIGGER           
            IERC20(position.collateralToken).safeTransferFrom(
                position.puppet,
                position.vaultAddress,
                collateralMasterWDecimals
            );            
        }else{
            //MAX OUT COLLATERAL IF PUPPETS COLLATERAL AVAILABLE IS SMALLER THAN MASTERS
            size = leveragedTotalCollateralUSD;
            IERC20(position.collateralToken).safeTransferFrom(
                position.puppet,
                position.vaultAddress,
                totalBalanceOfCollateral
            );
        }                                                          
        
        console.log("***********************************************"); 
        console.log("** FROM CONTRACT INCREASE POSITION FUNCTION  **");
        console.log("MASTER COLLATERAL USD => ", position.collateral.div(10**30));
        console.log("COLLATERAL AVAILABLE PUPPET TOTAL USD => ", totalBalanceOfCollateralUSD.div(10**30));
        console.log("COLLATERAL MASTER CONVERSION ETH => ", collateralMasterWDecimals.div(10**18));
        console.log("COLLATERAL PUPPET MAX OUT ETH AVAILABLE=> ", totalBalanceOfCollateral.div(10**18));
        console.log("MASTER SIZE USD => ", position.size.div(10**30));
        console.log("SIZE OF PUPPET USD=> ", size.div(10**30));
        console.log("PRICE USD => ", position.price.div(10**30));
        console.log("POSITION LEVERAGE => ", position.leverage);
        console.log("***********************************************");                   

        position.vault.increasePosition(
            position.puppet,
            position.collateralToken,
            position.indexToken,            
            size,
            position.isLong
        );
    }

    function _decreasePosition(
        DecreasePositionSt memory position
    ) private {

        GetPosition memory positionPuppet = getVaultPosition(
            position.puppet,
            position.collateralToken,
            position.indexToken,
            position.isLong,
            position.vault
        );

        uint256 size = position.size;
        uint256 collateral = position.collateral;

        if(position.collateral == 0){
            collateral = positionPuppet.collateral;
            size = positionPuppet.size;
        }

        if(position.collateral > 0 && positionPuppet.collateral > position.collateral ){
            collateral = position.collateral;
            size = position.size;
        }
        
        console.log("***********************************************"); 
        console.log("** FROM CONTRACT DECREASE POSITION FUNCTION  **");
        console.log("MASTER COLLATERAL USD => ", position.collateral.div(10**30));
        console.log("COLLATERAL AVAILABLE PUPPET TOTAL USD => ", positionPuppet.collateral.div(10**30));                
        console.log("MASTER SIZE USD => ", position.size.div(10**30));
        console.log("SIZE OF PUPPET USD=> ", size.div(10**30));
        console.log("PRICE USD => ", position.price.div(10**30));        
        console.log("***********************************************");                   

        position.vault.decreasePosition(
            position.puppet,
            position.collateralToken,
            position.indexToken, 
            collateral,
            size,           
            position.isLong,
            position.puppet
        );
    }

    function increasePosition(        
        IVault _vault,
        address _master,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        address _puppet,
        address _vaultAddress
    ) external onlyKeeper {
        //1. CHECK IF THERE'S FOLLOW --> DO SOME CHECKS
        //1.1 IF THE MASTER TRADER DID 100 DO 1OO OR MAX BALANCEOF.... (GRETEAR OR LESS COMPARISON)
        //1.2 WE'LL HAVE A TRESHOLD IN THE FUTURE (30% OF LIQUIDITY)
        //2. EMIT EVENT ONCE FINALIZED

        require(
            getIfFollowingMasterAndActive(_master, _puppet) == true,
            "Mirror: Not following this master"
        );

        GetPosition memory position = getVaultPosition(
            _master,
            _collateralToken,
            _indexToken,
            _isLong,
            _vault
        );

        uint256 leverage = position.size.div(position.collateral);

        require(position.size > 0, "Mirror: Invalid Position Size");
        
        IncreasePositionSt memory increasePositionD = IncreasePositionSt({
            vault: _vault,
            puppet: _puppet,
            collateralToken: _collateralToken,
            indexToken: _indexToken,
            size: position.size,
            collateral: position.collateral,
            isLong: _isLong,
            vaultAddress: _vaultAddress,
            leverage: leverage,
            price: position.price
        });

        _increasePosition(
            increasePositionD
        );

        GetPosition memory positionPuppet = getVaultPosition(
            _master,
            _collateralToken,
            _indexToken,
            _isLong,
            _vault
        );
        emit IncreasePosition(
            "PUPPET",
            _puppet,
            _collateralToken,
            _indexToken,
            positionPuppet.collateral,
            positionPuppet.size,
            _isLong,
            positionPuppet.price,
            positionPuppet.lastIncrease
        );
    }

    function decreasePosition(        
        IVault _vault,
        address _master,
        address _collateralToken,
        address _indexToken,
        bool _isLong,
        address _puppet,
        address _vaultAddress
    ) external onlyKeeper {
        //1. CHECK IF THERE'S FOLLOW --> DO SOME CHECKS
        //1.1 IF THE MASTER TRADER DID 100 DO 1OO OR MAX BALANCEOF.... (GRETEAR OR LESS COMPARISON)
        //1.2 WE'LL HAVE A TRESHOLD IN THE FUTURE (30% OF LIQUIDITY)
        //2. EMIT EVENT ONCE FINALIZED

        require(
            getIfFollowingMasterAndActive(_master, _puppet) == true,
            "Mirror: Not following this master"
        );

        GetPosition memory position = getVaultPosition(
            _master,
            _collateralToken,
            _indexToken,
            _isLong,
            _vault
        );
        
        
        DecreasePositionSt memory increasePositionD = DecreasePositionSt({
            vault: _vault,
            puppet: _puppet,
            collateralToken: _collateralToken,
            indexToken: _indexToken,
            size: position.size,
            collateral: position.collateral,
            isLong: _isLong,
            vaultAddress: _vaultAddress,            
            price: position.price,
            receiver: _puppet
        });

        _decreasePosition(
            increasePositionD
        );

        GetPosition memory positionPuppet = getVaultPosition(
            _master,
            _collateralToken,
            _indexToken,
            _isLong,
            _vault
        );

        emit DecreasePosition(
            "PUPPET",
            _puppet,
            _collateralToken,
            _indexToken,
            positionPuppet.collateral,
            positionPuppet.size,
            _isLong,
            positionPuppet.price,
            positionPuppet.lastIncrease,
             _puppet
        );
    }
}
