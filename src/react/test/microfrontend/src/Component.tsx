import { IntlProvider, useIntl } from "react-intl";
import { SDK_VERSION } from "firebase/app";
console.warn("Here also works");

export default function Comp() {
  return (
    <IntlProvider locale={"pt-br"}>
      <Test />
      <h1>
        In this microfrontend application we have a shared module for firebase
        that is not shared on the main application
      </h1>
      <p>Version: {SDK_VERSION}</p>
    </IntlProvider>
  );
}

window["mfe-firebase"] = require("firebase/app");
window["mfe-react"] = require("react");
window["mfe-refresh"] = require("react-refresh/runtime");

function Test() {
  const { formatDate } = useIntl();
  return (
    <>
      <h1>Date: {formatDate(new Date())}</h1>

      <h3>Equality table that now hot swaps or does it? Yes? Yeah!!!</h3>
      <table>
        <tr>
          <th>React</th>
          <th>React Refresh</th>
        </tr>
        <tr>
          <td>
            {window["app-react"] === window["mfe-react"]
              ? "Equal"
              : "Not equal"}
          </td>
          <td>
            {window["app-refresh"] === window["mfe-refresh"]
              ? "Equal"
              : "Not equal"}
          </td>
        </tr>
      </table>
    </>
  );
}
