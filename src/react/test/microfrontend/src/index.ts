import React from 'react';
import C from "./Component";
 console.warn("Here works")
export function RootComponent() {
    return React.createElement(C);
}

console.log("mfe", React)

export default RootComponent;