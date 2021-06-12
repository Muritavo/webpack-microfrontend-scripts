import { execSync } from "child_process";

it("Should compile application", () => {
    execSync("node ./bin/react/scripts/start");
})