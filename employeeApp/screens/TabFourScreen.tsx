import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity} from 'react-native';

import EditScreenInfo from '../components/EditScreenInfo';
import { styles } from '../css/styles';
import { Text, View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { useWalletConnect } from '@walletconnect/react-native-dapp';

import "react-native-get-random-values";
import "@ethersproject/shims";
import { ethers } from "ethers";
import { makeLabortxobj, laborContract, ERC20Contract } from "../connectETH/Transaction";
//import { connectWallet } from "../connectETH/connectWallet";

// 프로필

const shortenAddress = (address: string) => {
  return `${address.slice(0, 10)}...${address.slice(
    address.length - 4,
    address.length
  )}`;
}

export default function TabFourScreen({navigation} : RootTabScreenProps<'TabFour'>) {

  const [personalinfo, setPersonalinfo] = useState<string[]>([]);
  const [mymoney, setMymoney] = useState<string>();
  const [wpinfo, setWpinfo] = useState();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (connector.connected) {
      getPersonInformation();
    }
  }, []);

  // walletconnect 세션을 저장하는 hook
  const connector = useWalletConnect();

  const connectWallet = React.useCallback(() => {
    return connector.connect();
}, [connector]);

  // wallet과 연결 종료하기
  const killSession = React.useCallback(() => {
    return connector.killSession();
  }, [connector]);

  // 개인정보 불러오기
  const getPersonInformation = (async() => {
    let result = await laborContract.getPersonInformation(connector.accounts[0], { from : connector.accounts[0] });

    let result2 = await ERC20Contract.balanceOf(connector.accounts[0], { from : connector.accounts[0] });

    let temp = [];

    for (let x = 0 ; x < result[4][1].length; x++) {
      let result3 = await laborContract.getWorkplcesInfo(ethers.utils.formatUnits(result[4][0][x], 0), { from : connector.accounts[0] });
      temp.push(result3);
    }

    if (result[1] == 0) {
      setReady(null);
    } else {
      setPersonalinfo([
      decodeURI(result[1]),
      ethers.utils.formatUnits(result[2], 0),
      decodeURI(result[3]),
      result[4]
      ])
      setWpinfo(temp);
      setMymoney(ethers.utils.formatUnits(result2, 0));
      setReady(true);
    }
  })

  // 개인정보 업로드
  const uploadPersonalInfo = (async () => {

      let abidata = new ethers.utils
      .Interface(["function uploadPersonalInfo(address person, uint8 identiNumber, string calldata name, uint age, string calldata gender)"])
      .encodeFunctionData("uploadPersonalInfo", [connector.accounts[0], 0, encodeURI("이서윤"), 24, encodeURI("남")]);
      let txObj = await makeLabortxobj(connector.accounts[0], abidata, 100000);
  
      try {
        await connector.sendTransaction(txObj)
        .then((result) => {
          console.log("tx hash:", result);
          console.log(`https://ropsten.etherscan.io/tx/${result}`)
        });
      } catch (e) {
        console.error(e);
      };
  
  })


  // 경력 jsx 컴포넌트 만들기
  const makeJsx = () => {
    let workplaceInfo = [];
    console.log(wpinfo);
    for (let x = 0 ; x < personalinfo[3][1].length; x++) {

      if(personalinfo[3][2][x] == "0") {
        workplaceInfo.push(
          <View key={x}>
            <Text>{decodeURI(wpinfo[x][0])}</Text>
            <Text>{personalinfo[3][1][x]} ~ 근무중</Text>
          </View>
        );
      } else {
        workplaceInfo.push(
          <View key={x}>
            <Text>{decodeURI(wpinfo[x][0])}</Text>
            <Text>{personalinfo[3][1][x]} ~ {personalinfo[3][2][x]}</Text>
          </View>
        );
      }
      
    }

    return workplaceInfo;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab Four</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      {!connector.connected && (
        <TouchableOpacity onPress={connectWallet} style={styles.buttonStyle}>
          <Text style={styles.buttonTextStyle}>Connect a Wallet</Text>
        </TouchableOpacity>
      )}
      {connector.connected && ready == false && (
        <>
          <Text>잠시만 기다려주세요...</Text>
        </>
      )}
      {connector.connected && ready == null && (
        <>
          <TouchableOpacity onPress={uploadPersonalInfo} style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}>개인정보 업로드</Text>
          </TouchableOpacity>
          <Text>개인 정보가 없습니다.</Text>
        </>
      )}
      {(connector.connected && ready) && (
        <>
          <Text>{personalinfo[0]}</Text>
          <Text>Address : {shortenAddress(connector.accounts[0])}</Text>
          <Text>성별 : {personalinfo[1]}</Text>
          <Text>나이 : {personalinfo[2]}</Text>
          <Text>내 잔액 : {mymoney}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('LaborContractViewAllScreen')} style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}>근로계약서 모두 보기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={killSession} style={styles.buttonStyle}>
            <Text style={styles.buttonTextStyle}>Logout</Text>
          </TouchableOpacity>
          {makeJsx()}
        </>
      )}
    </View>
  );
}