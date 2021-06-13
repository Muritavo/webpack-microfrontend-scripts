import { render } from "react-dom";
import React from 'react';
import App from './App';

console.warn("something")

render(React.createElement(App), document.body.firstElementChild);