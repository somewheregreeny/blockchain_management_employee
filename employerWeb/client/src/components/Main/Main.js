import React, { Component, useEffect, useState } from "react";

import styled from "styled-components";
import Categories from "../Categories/Categories";
import RightSideComponent from "./RightSideComponent";
import Calendar from "./Calendar";

const Container = styled.div`
  background: #f5f8fb;
  width: 1900px;
  height: auto;
  display: flex;
`;

const Content = styled.div`
  box-shadow: 5px 5px 5px 5px gray;
  border-radius: 20px;
  padding: 10px;
  margin: 30px;
  width: 1074px;
  height: 860px;
  background-color: #f7f7f7;
  float: left;

  h1 {
    font-family: "Noto Sans CJK KR";
    font-size: 28px;
  }
`;

const Main = ({ accounts, contract, name, workers }) => {
  // test용 데이터
  // title : 표시되는 이름
  // color : RGB 색상
  // display(고정) : 둥근 아이콘

  //const [name, setName] = useState();
  const [attendance, setAttendance] = useState();

  const [calready, setCalready] = useState(false);

  useEffect(() => {
    getAttendance();
  }, []);

  useEffect(() => {
    setCalready(true);
  }, [attendance]);

  const getAttendance = async () => {
    //const response = await contract.methods.getWorkplaces().call({ from: accounts[0] });

    //console.log(response[0]);

    let event = [];

      for (let x = 0; x < workers[0].length ; x++) {
        let caldata = await contract.methods.getCalAttendance(0, x).call({ from: accounts[0] });
        console.log(caldata);

        if (caldata[0].length == caldata[1].length) {

          for (let y = 0 ; y < caldata[0].length; y++) {
            event.push({
              title: decodeURI(workers[1][x]),
              start: caldata[0][y],
              color: "#00FF00",
              display: "list-item",
            })
          }

        } else {
          for (let y = 0 ; y < caldata[0].length - 1; y++) {
            event.push({
              title: decodeURI(workers[1][x]),
              start: caldata[0][y],
              color: "#00FF00",
              display: "list-item",
            })
          }

          event.push({
            title: decodeURI(workers[1][x]),
            start: caldata[0][caldata[0].length - 1],
            color: "##0037ff",
            display: "list-item",
          })
        }
      }

      setAttendance(event);
  };

  return (
    <Container>
      <Categories name={name} />
      {!calready && <p>잠시만 기다려주세요 ...</p>}
      {calready && (
        <Content>
          <h1> 출/퇴근 기록부 </h1>
          <Calendar attendance={attendance} />
        </Content>
      )}
      {/* TODO QR 데이터, 근태 데이터 전달해줄 것 */}
      <RightSideComponent />
    </Container>
  );
};

export default Main;