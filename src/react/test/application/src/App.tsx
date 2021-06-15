import './global.css';
import './global.scss';
import JSONObject from './somejson.json';
import styled from 'styled-components';
import SomeStyles from "./App.module.scss";
import { useMemo } from 'react';
import AnotherComponent from './AnotherComponent';

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

export default function App() {
  const oneTimeOnly = useMemo(() => new Date().toISOString(), []);
  return (
    <>
      <h1>Initialization time: {oneTimeOnly}</h1>
      <Title>Some title</Title>
      <h1>A simple application</h1>
      <div className="document">
        <div className="title">Some title that is styled</div>

        <p className={SomeStyles.somestuff}>Some other stuff</p>

        <p className="title">Some prop from json: {JSONObject.some}</p>
      </div>
      <AnotherComponent/>
    </>
  );
}
