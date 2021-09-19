import { IntlProvider, useIntl } from "react-intl";
console.warn("Here also works");

export default function Comp() {
  return (
    <IntlProvider locale={"pt-br"}>
      <Test />
    </IntlProvider>
  );
}

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
