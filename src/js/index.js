import React from 'react'
import ReactDOM from 'react-dom'
import Web3 from 'web3'
import conf from './conf'
import './../css/index.css'
import {abi as stakeABI} from '../../build/contracts/Stake.json'
import {abi as levABI} from '../../build/contracts/Token.json'

class App extends React.Component {
  constructor () {
    super()

    window.web3 = new Web3(web3.currentProvider || new Web3.providers.HttpProvider(conf.network));
    window.stake = new web3.eth.Contract(stakeABI, conf.stake);
    window.lev = new web3.eth.Contract(levABI, conf.lev)

    // We use this.state because it updates the view automatically whenever this
    // object changes. This makes everything react to object changes
    this.state = {
      loadingInitialData: true
    }
    this.updateStakeData().then(() => {
      this.setState({loadingInitialData: false})
      this.updateAllowance()
    })
  }

  updateStakeData () {
    return new Promise(async (resolve, reject) => {
      // Use this.setState to change the state object
      this.setState({
        account: (await web3.eth.getAccounts())[0],
        totalLevs: await stake.methods.totalLevs().call(),
        totalLevBlocks: await stake.methods.totalLevBlocks().call(),
        weiPerFee: await stake.methods.weiPerFee().call(),
        feeForThePeriod: await stake.methods.feeForThePeriod().call(),
        tokenid: await stake.methods.tokenid().call(),
        startBlock: await stake.methods.startBlock().call(),
        expiryBlock: await stake.methods.expiryBlock().call(),
        currentPeriod: await stake.methods.currentPeriod().call(),
        owner: await stake.methods.owner().call(),
        wallet: await stake.methods.wallet().call(),
        feeTokenId: await stake.methods.feeTokenId().call(),
        weiAsFee: await stake.methods.weiAsFee().call(),
        feeCalculated: await stake.methods.feeCalculated().call()
      }, resolve)
    })
  }

  updateAllowance () {
    return new Promise(async (resolve, reject) => {
      // Use this.setState to change the state object
      this.setState({
        allowance: web3.utils.fromWei(await lev.methods.allowance(this.state.account, stake._address).call(), 'ether')
      }, resolve)
    })
  }

  // To approve 100 LEV tokens to the stake contract from the user address
  async approve (amount) {
    // 100 Ether is the same as 100 LEV since they both have 18 decimals so we can
    // convert them easily with web3
    await lev.methods.approve(stake._address, web3.utils.toWei(amount, 'ether')).send({
      from: this.state.account
    })
  }

  async stakeTokens (stakeAmount) {
    await stake.methods.stakeTokens(web3.utils.toWei(stakeAmount, 'ether')).send({
      from: this.state.account
    })
  }

  render () {
    return (
      <div>
        <div className={this.state.loadingInitialData ? '' : 'hidden'}>
          <p>Loading initial data make sure you're on the Ropsten test network, plase wait...</p>
        </div>
        <div className={this.state.loadingInitialData ? 'hidden' : 'contract-data'}>
          <h2>Stake Smart Contract</h2>
          <button disabled={this.state.isUpdatingStakeData ? true : false} onClick={async () => {
            this.setState({ isUpdatingStakeData: true })
            await this.updateStakeData()
            this.setState({ isUpdatingStakeData: false })
          }}>Update stake data</button>
          <br/>
          <p>Account: </p><span>{this.state.account}</span><br/>
          <p>Total levs: </p><span>{this.state.totalLevs}</span><br/>
          <p>Total lev blocks: </p><span>{this.state.totalLevBlocks}</span><br/>
          <p>Wei per fee: </p><span>{this.state.weiPerFee}</span><br/>
          <p>Fee for this period: </p><span>{this.state.feeForThisPeriod}</span><br/>
          <p>Lev token address: </p><span>{this.state.tokenid}</span><br/>
          <p>Start block: </p><span>{this.state.startBlock}</span><br/>
          <p>Expiry block: </p><span>{this.state.expiryBlock}</span><br/>
          <p>Current period: </p><span>{this.state.currentPeriod}</span><br/>
          <p>Owner: </p><span>{this.state.owner}</span><br/>
          <p>Wallet: </p><span>{this.state.wallet}</span><br/>
          <p>Fee token ID: </p><span>{this.state.feeTokenId}</span><br/>
          <p>Wei as Fee: </p><span>{this.state.weiAsFee}</span><br/>
          <p>Fee calculated: </p><span>{this.state.feeCalculated}</span><br/>
          <hr/>
          <p>Approve tokens to Stake.sol: </p>
          <input type="number" ref="approve-amount" onChange={() => {
            this.setState({approveAmount: this.refs['approve-amount'].value})
          }}/>&nbsp;
          <button onClick={() => {
            this.approve(this.state.approveAmount)
          }}>Approve {this.state.approveAmount} LEV</button><br/>

          <p>Check allowance: </p><button disabled={this.state.isUpdatingAllowance ? true : false} onClick={async () => {
            this.setState({ isUpdatingAllowance: true })
            await this.updateAllowance()
            this.setState({ isUpdatingAllowance: false })
          }}>Allowance</button> <span>{this.state.allowance}</span><br/>

          <p>Stake tokens: </p>
          <input type="number" ref="stake-amount" onChange={() => {
            this.setState({stakeAmount: this.refs['stake-amount'].value})
          }}/>&nbsp;
          <button onClick={() => {
            this.stakeTokens(this.state.stakeAmount)
          }}>Stake now {this.state.stakeAmount} LEVs</button><br/>
        </div>
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.querySelector('#root')
)