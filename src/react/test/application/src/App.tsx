import './global.css';
import './global.scss';
import JSONObject from './somejson.json';
import styled from 'styled-components';
import SomeStyles from './App.module.scss';
import React, { useEffect, useMemo, useState } from 'react';
import AnotherComponent from './AnotherComponent';
import { IntlProvider } from 'react-intl';
const Title = styled.h1`
  font-size: 1.5em;
  text-align: center;
  color: palevioletred;
`;

console.warn(React)
declare var __webpack_share_scopes__: any;

console.warn("__webpack_share_scopes__", __webpack_share_scopes__)

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
      <IntlProvider locale="en-us">
        <AnotherComponent />
      </IntlProvider>
      <MicrofrontendLoader />
    </>
  );
}

declare var System;
function MicrofrontendLoader() {
  const [LoadedModule, setLoadedModule] = useState<React.FC>();
  useEffect(() => {
    System.import('http://localhost:19000/index.js')
      .then((m: any) => {
        m.init(__webpack_share_scopes__.default)
        return m.get("entry")
      })
      .then((m) => m())
      .then((m) => {
        setLoadedModule(() => m.default);
      })
      .catch((e) => {
        setLoadedModule(() => () => <p>Something went wrong {e.message}</p>)
      });
  }, []);
  return LoadedModule ? <LoadedModule/> : null;
}
