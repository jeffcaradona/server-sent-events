import debugLib from "debug";

const debug = (namespace) => debugLib(namespace); 


const moduleName = "server-sent-events";

const debugServer = debug(`${moduleName}:server`);

const debugApplication = debug(`${moduleName}:application`);

const debugRoutes = debug(`${moduleName}:routes`);

const debugControllers = debug(`${moduleName}:controllers`);