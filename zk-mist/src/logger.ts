import { createLogger, transports, format } from "winston";
import { Console } from "./utils/console";

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD hh:mm:ss.SSS",
    }),
    format.align(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
});

logger.add(
  new Console({
    silent: false,
    level: "info",
  })
);
export { logger };
