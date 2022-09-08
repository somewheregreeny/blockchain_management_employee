import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

import { Text, View } from '../components/Themed';
import { styles } from '../css/styles';
import { RootTabScreenProps } from '../types';
import * as WebBrowser from 'expo-web-browser';

import { useWalletConnect } from '@walletconnect/react-native-dapp';

import "react-native-get-random-values";
import "@ethersproject/shims";
import { ethers } from "ethers";

import { makeLabortxobj } from "../connectETH/Transaction";

import { ENDPOINT } from "@env";

import axios from "axios";

// 출근 퇴근하기
export default function SendAttendanceScreen({ navigation, route }: RootTabScreenProps<'AttendanceCheckScreen'>) {
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);
  const [scandata, setScandata] = useState<any>();
  const [isright, setIsrigt] = useState<boolean | null>(null);

  const [txhash, setTxhash] = useState<any>();
  const [issendtx, setIssendtx] = useState<boolean | null>(null);

  const [time, setTime] = useState<object>();

  const TODAY = "2022-08-31"
  const ONWORK = "12:00"
  const OFFWORK = "20:00"

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // walletconnect 세션을 저장하는 hook
  const connector = useWalletConnect();

  // 현재 시간과 날짜를 불러옴
  const getTime = async() => {
    let time = new Date();

    let year = time.getFullYear();
    let month = time.getMonth() + 1;
    let day = time.getDate();

    let hour = time.getHours();
    let min = time.getMinutes();

    let temp = {
      date : year+"-"+(("0"+month.toString()).slice(-2))+"-"+(("0"+day.toString()).slice(-2)),
      hour,
      min
    };
    setTime(temp);
  }

  // 출/퇴근하기
  const uploadWork = async () => {

    await getTime();

    let hour;
    let min;

    if (route.params.num === 0) {
      hour = parseInt(ONWORK.slice(0, 2))
      min = parseInt(ONWORK.slice(3, 5))
    } else {
      hour = parseInt(OFFWORK.slice(0, 2))
      min = parseInt(OFFWORK.slice(3, 5))
    }
    console.log(hour, min)

    let abidata = new ethers.utils
    .Interface(["function uploadAttendance(uint8 classifyNum, uint workPlaceInfoIndex, string calldata day, int timeHour, int timeMinute)"])
    .encodeFunctionData("uploadAttendance", [route.params.num, route.params.index, TODAY, hour, min]);
    let txObj = await makeLabortxobj(connector.accounts[0], abidata, 200000);

    try {
      await connector.sendTransaction(txObj)
      .then((result) => {
        console.log("tx hash:", result);
        console.log(`https://ropsten.etherscan.io/tx/${result}`)
        setTxhash(result);
        setIssendtx(true);
      });
    } catch (e) {
      console.error(e);
      setIssendtx(false);
    };

  };

  const _handlePressButtonAsync = async () => {
    await WebBrowser.openBrowserAsync(`https://ropsten.etherscan.io/tx/${txhash}`);
  };

  // qr코드 스캔 후 출근퇴근에 따라 분류
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setScandata(data);

    try {
      const response = await axios.get(
        `${ENDPOINT}qrcode?workplaceindex=${route.params.index}&date=${TODAY}`
      );

      if (response.data.randomnum == data) await uploadWork();
      else setIsrigt(false);
    } catch(e) {
      console.log(e);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {!scanned && (
        <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
        />
      )}
      {scanned && isright === false &&(
        <>
          <Text style={styles.title}>해당 QR코드가 근로지의 QR코드와 일치하지 않습니다.</Text>
        </>
      )}
      {scanned && issendtx === null && isright !== false &&(
        <Text style={styles.title}>잠시만 기다려주세요...</Text>
      )}
      {scanned && issendtx === false &&(
        <Text style={styles.title}>트랜잭션 전송에 실패했습니다.</Text>
      )}
      {scanned && issendtx &&(
        <>
          <Text>{time.date} {time.hour}:{time.min}</Text>
          {route.params.num === 0 && (
            <Text style={styles.title}>출근을 완료했습니다.</Text>
          )}
          {route.params.num === 1 && (
            <Text style={styles.title}>퇴근을 완료했습니다.</Text>
          )}
          <TouchableOpacity style={styles.buttonStyle} onPress={_handlePressButtonAsync}>
            <Text style={styles.buttonTextStyle}>etherscan</Text>
          </TouchableOpacity>
        </>
      )}
      </View>
  );
}
