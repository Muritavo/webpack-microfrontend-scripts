import './global.css';
import './global.scss';
import { some } from './somejson.json';
import styled from 'styled-components';
import SomeStyles from "./App.module.scss";

const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

export default function App() {
  return (
    <>
      <Title>Some title</Title>
      <h1>A simple application</h1>
      <div className="document">
        <div className="title">Some title that is styled</div>

        <p className={SomeStyles.somestuff}>Some other stuff</p>

        <p className="title">Some prop from json: {some}</p>
      </div>
    </>
  );
}
