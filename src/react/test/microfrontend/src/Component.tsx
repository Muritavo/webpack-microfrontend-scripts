import { IntlProvider, useIntl } from "react-intl";
console.warn("Here also works")

export default function Comp() {
    return <IntlProvider locale={"pt-br"}>
        <Test/>
    </IntlProvider>
}

function Test() {
    const { formatDate } = useIntl();
    return <h1>{formatDate(new Date())}</h1>
}