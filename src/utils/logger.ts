// 引入文件系统模块的同步方法，用于创建目录和检查目录是否存在
import { mkdirSync, existsSync } from 'fs';
// 引入路径模块的 join 方法，用于拼接路径
import { join } from 'path';

// 引入 winston 日志库，以及创建日志记录器和日志格式化相关的方法
import winston, { createLogger, format } from 'winston';
// 引入 winston-daily-rotate-file 模块，用于按天轮转日志文件
import DailyRotateFile from 'winston-daily-rotate-file';

// 设置日志目录，根据环境选择适当的目录
// 在服务器环境中使用 /tmp 目录，在本地开发环境中使用项目根目录下的 logs 文件夹
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';
const projectRoot = process.cwd();
const logDirectory = isServerless ? '/tmp/logs' : join(projectRoot, 'logs');

console.log("logDirectory", logDirectory)
// 确保 logs 目录存在，如果不存在则创建该目录
if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory, { recursive: true });
}

// 公共配置项，用于配置日志文件的轮转相关设置
const commonTransportOptions = {
  // 是否对旧日志文件进行压缩存档
  zippedArchive: true,
  // 单个日志文件的最大大小为 20MB
  maxSize: '20m',
  // 保留日志文件的天数为 14 天
  maxFiles: '14d',
  // 日志文件名中的日期模式
  datePattern: 'YYYY-MM-DD'
};

// 自定义日志格式化函数
const customFormat = format.printf(info => {
  const { timestamp, level, message, ...otherInfo } = info;

  if (typeof message === 'object' && message !== null) {
    // 将时间戳放在消息的最前面
    return `${timestamp} : ${JSON.stringify(message)}`;
  }

  return `${timestamp} [${message}] : ${JSON.stringify(otherInfo)}`;
});


const getLogFilePath = (level: string) => {
  const dateFolder = new Date().toISOString().slice(0, 10); // 获取当前日期如 YYYY-MM-DD
  const dirPath = join(logDirectory, dateFolder); // 日志文件所在的目录

  // 确保目录存在
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }

  return join(dirPath, `%DATE%-${level}.log`);
}

// 创建一个日志记录器实例
export const logger = createLogger({
  // 设置日志记录的最低级别为 info，即只有级别大于等于 info 的日志才会被记录
  level: 'info',
  // 配置日志格式化，将时间戳添加到日志中，并以 JSON 格式输出日志
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat // 使用自定义格式化函数
  ),
  // 配置日志传输，定义日志输出的目标
  transports: isServerless ? [
    // 在服务器环境中，只使用控制台输出，避免文件系统权限问题
    new winston.transports.Console({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.colorize(),
        customFormat
      )
    })
  ] : [
    // 用于记录 error 级别的日志，日志文件名为 %DATE%-error.log
    new DailyRotateFile({
      filename: getLogFilePath("error"),
      level: 'error',
      ...commonTransportOptions
    }),
    // 用于记录 warn 级别的日志，日志文件名为 %DATE%-warn.log
    new DailyRotateFile({
      filename: getLogFilePath("warn"),
      level: 'warn',
      ...commonTransportOptions
    }),
    // 用于记录 info 级别的日志，日志文件名为 %DATE%-info.log
    new DailyRotateFile({
      filename: getLogFilePath("info"),
      level: 'info',
      ...commonTransportOptions
    }),
    // 用于记录 debug 级别的日志，日志文件名为 %DATE%-debug.log
    new DailyRotateFile({
      filename: getLogFilePath("debug"),
      level: 'debug',
      ...commonTransportOptions
    })
  ]
});

// 如果当前环境不是生产环境（NODE_ENV 环境变量不等于 production）
// if (process.env.NODE_ENV!== 'production') {
//   // 添加控制台传输，用于在控制台输出日志，方便调试
//   logger.add(new winston.transports.Console({
//     // 配置控制台日志格式化，添加颜色和简化格式
//     format: format.combine(
//       // 为日志添加颜色
//       format.colorize(),
//       // 简化日志格式
//       format.simple()
//     )
//   }));
// }
