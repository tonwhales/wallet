import { NativeModules } from "react-native";

const { HttpServerModule } = NativeModules;

interface HttpServer {
    startServer: (host: string, port: number) => Promise<void>;
    stopServer: () => Promise<void>;
}

export default HttpServerModule as HttpServer;
