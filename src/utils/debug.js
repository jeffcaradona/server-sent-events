import debugLib from "debug";

const debug = (namespace) => debugLib(namespace); 


let subsystem = "";


const module = "server-sent-events";

subsystem = "server";
const debugServer = debug(`${module}:${subsystem}`);

subsystem = "application";
const debugApplication = debug(`${module}:${subsystem}`);

subsystem = "routes";
const debugRoutes = debug(`${module}:${subsystem}`);

subsystem = "controllers";
const debugControllers = debug(`${module}:${subsystem}`);

export { debugServer, debugApplication, debugRoutes, debugControllers };

export default debug; 

