import './global.css';
import './global.scss';
import JSONObject from './somejson.json';
import styled from 'styled-components';
import SomeStyles from './App.module.scss';
import { useMemo, useState } from 'react';
import AnotherComponent from './AnotherComponent';
import { IntlProvider } from 'react-intl';
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
      <IntlProvider locale="en-us">
        <AnotherComponent />
      </IntlProvider>
      <MicrofrontendLoader />
    </>
  );
}

declare var System;
function MicrofrontendLoader() {
  const [LoadedModule, setLoadedModule] = useState();
  System.import('http://localhost:19000/index.js')
    .then((m) => {
      setLoadedModule(() => m.default);
    })
    .catch(console.error);
    console.warn(LoadedModule)
  return LoadedModule ? <LoadedModule/> : null;
}
