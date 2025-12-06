import axios from 'axios';
import cfonts from 'cfonts';
import gradient from 'gradient-string';
import chalk from 'chalk';
import fs from 'fs/promises';
import readline from 'readline';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import ora from 'ora';
import { ethers } from 'ethers';

const logger = {
  info: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || 'ℹ️  ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.green('INFO');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  },
  warn: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || '⚠️ ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.yellow('WARN');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  },
  error: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || '❌ ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.red('ERROR');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  },
  debug: (msg, options = {}) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const emoji = options.emoji || '🔍  ';
    const context = options.context ? `[${options.context}] ` : '';
    const level = chalk.blue('DEBUG');
    const formattedMsg = `[ ${chalk.gray(timestamp)} ] ${emoji}${level} ${chalk.white(context.padEnd(20))}${chalk.white(msg)}`;
    console.log(formattedMsg);
  }
};

function delay(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function countdown(seconds, message) {
  return new Promise((resolve) => {
    let remaining = seconds;
    process.stdout.write(`${message} ${remaining}s remaining...`);
    const interval = setInterval(() => {
      remaining--;
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${message} ${remaining}s remaining...`);
      if (remaining <= 0) {
        clearInterval(interval);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        resolve();
      }
    }, 1000);
  });
}

function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}

function centerText(text, width) {
  const cleanText = stripAnsi(text);
  const textLength = cleanText.length;
  const totalPadding = Math.max(0, width - textLength);
  const leftPadding = Math.floor(totalPadding / 2);
  const rightPadding = totalPadding - leftPadding;
  return `${' '.repeat(leftPadding)}${text}${' '.repeat(rightPadding)}`;
}

function printHeader(title) {
  const width = 80;
  console.log(gradient.morning(`┬${'─'.repeat(width - 2)}┬`));
  console.log(gradient.morning(`│ ${title.padEnd(width - 4)} │`));
  console.log(gradient.morning(`┴${'─'.repeat(width - 2)}┴`));
}

function printInfo(label, value, context) {
  logger.info(`${label.padEnd(15)}: ${chalk.cyan(value)}`, { emoji: '📍 ', context });
}

function printProfileInfo(username, points, level, context) {
  printHeader(`Profile Info ${context}`);
  printInfo('Username', username || 'N/A', context);
  printInfo('Total Points', points.toString(), context);
  printInfo('Level', level.toString(), context);
  console.log('\n');
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/102.0'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function getAxiosConfig(proxy, additionalHeaders = {}, cookies = [], isPrivy = false) {
  const headers = {
    'accept': 'application/json, text/plain, */*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'en-US,en;q=0.9,id;q=0.8',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    'origin': 'https://mm.pip.world',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-site',
    'user-agent': getRandomUserAgent(),
    ...additionalHeaders
  };
  if (isPrivy) {
    headers['privy-app-id'] = 'cmd5wk49c01qejr0m6tun1ri5';
    headers['privy-client'] = 'react-auth:2.13.7';
    headers['privy-ca-id'] = 'ba09e661-6fef-4548-9518-e0e86f265c35';
  }
  if (cookies.length > 0) {
    headers['cookie'] = cookies.join('; ');
  }
  const config = {
    headers,
    timeout: 60000
  };
  if (proxy) {
    config.httpsAgent = newAgent(proxy);
    config.proxy = false;
  }
  return config;
}

function newAgent(proxy) {
  if (proxy.startsWith('http://') || proxy.startsWith('https://')) {
    return new HttpsProxyAgent(proxy);
  } else if (proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
    return new SocksProxyAgent(proxy);
  } else {
    logger.warn(`Unsupported proxy: ${proxy}`);
    return null;
  }
}

async function requestWithRetry(method, url, payload = null, config = {}, retries = 3, backoff = 2000, context) {
  for (let i = 0; i < retries; i++) {
    try {
      let response;
      if (method.toLowerCase() === 'get') {
        response = await axios.get(url, config);
      } else if (method.toLowerCase() === 'post') {
        response = await axios.post(url, payload, config);
      } else {
        throw new Error(`Method ${method} not supported`);
      }
      return response;
    } catch (error) {
      let errorMsg = error.message;
      if (error.response) {
        errorMsg += ` | Status: ${error.response.status} | Body: ${JSON.stringify(error.response.data || 'No body')}`;
      }
      logger.error(`Request failed: ${errorMsg}`, { context });

      if (error.response && error.response.status >= 500 && i < retries - 1) {
        logger.warn(`Retrying ${method.toUpperCase()} ${url} (${i + 1}/${retries}) due to server error`, { emoji: '🔄', context });
        await delay(backoff / 1000);
        backoff *= 1.5;
        continue;
      }
      if (i < retries - 1) {
        logger.warn(`Retrying ${method.toUpperCase()} ${url} (${i + 1}/${retries})`, { emoji: '🔄', context });
        await delay(backoff / 1000);
        backoff *= 1.5;
        continue;
      }
      throw error;
    }
  }
}

async function readAccounts() {
  try {
    const data = await fs.readFile('pk.txt', 'utf-8');
    const privateKeys = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const accounts = privateKeys.map(pk => ({ privateKey: pk }));
    if (accounts.length === 0) {
      throw new Error('No private keys found in pk.txt');
    }
    logger.info(`Loaded ${accounts.length} account${accounts.length === 1 ? '' : 's'}`, { emoji: '🔑 ' });
    return accounts;
  } catch (error) {
    logger.error(`Failed to read pk.txt: ${error.message}`, { emoji: '❌ ' });
    return [];
  }
}

async function readProxies() {
  try {
    const data = await fs.readFile('proxy.txt', 'utf-8');
    const proxies = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (proxies.length === 0) {
      logger.warn('No proxies found. Proceeding without proxy.', { emoji: '⚠️ ' });
    } else {
      logger.info(`Loaded ${proxies.length} prox${proxies.length === 1 ? 'y' : 'ies'}`, { emoji: '🌐 ' });
    }
    return proxies;
  } catch (error) {
    logger.warn('proxy.txt not found.', { emoji: '⚠️ ' });
    return [];
  }
}

function maskAddress(address) {
  return address ? `${address.slice(0, 6)}${'*'.repeat(6)}${address.slice(-6)}` : 'N/A';
}

function deriveWalletAddress(privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    logger.error(`Failed to derive address: ${error.message}`);
    return null;
  }
}

async function createSIWEMessageAndSign(privateKey, address, nonce, uri = 'https://mm.pip.world', chainId = '11155111') {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const issuedAt = new Date().toISOString();
    const message = `${uri} wants you to sign in with your Ethereum account:\n${address}\n\nBy signing, you are proving you own this wallet and logging in. This does not initiate a transaction or cost any fees.\n\nURI: ${uri}\nVersion: 1\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nResources:\n- https://privy.io`;

    const signature = await wallet.signMessage(message);

    return {
      message,
      signature,
      chainId: `eip155:${chainId}`,
      walletClientType: "metamask",
      connectorType: "injected",
      mode: "no-signup"
    };
  } catch (error) {
    throw new Error(`Failed to create SIWE payload: ${error.message}`);
  }
}

async function initSIWE(address, proxy, context) {
  const url = 'https://privy.pip.world/api/v1/siwe/init';
  const payload = { address };
  const config = getAxiosConfig(proxy, {}, [], true);
  const spinner = ora({ text: 'Initializing SIWE...', spinner: 'dots' }).start();
  try {
    const response = await requestWithRetry('post', url, payload, config, 3, 2000, context);
    spinner.stop();
    if (response.data.nonce) {
      return response.data.nonce;
    } else {
      throw new Error('Failed to init SIWE');
    }
  } catch (error) {
    spinner.fail(chalk.bold.redBright(` Failed to init SIWE: ${error.message}`));
    return null;
  }
}

async function authenticateSIWE(privateKey, address, nonce, proxy, context) {
  const url = 'https://privy.pip.world/api/v1/siwe/authenticate';
  const payload = await createSIWEMessageAndSign(privateKey, address, nonce);
  const config = getAxiosConfig(proxy, {}, [], true);
  const spinner = ora({ text: 'Authenticating SIWE...', spinner: 'dots' }).start();
  try {
    const response = await requestWithRetry('post', url, payload, config, 3, 2000, context);
    spinner.stop();
    if (response.data.token) {
      return response.data.token;
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    spinner.fail(chalk.bold.redBright(` Failed to authenticate SIWE: ${error.message}`));
    return null;
  }
}

async function getTasks(proxy, context, cookies) {
  const url = 'https://api-mm.pip.world/xp-tasks';
  const config = getAxiosConfig(proxy, {}, cookies, false);
  const spinner = ora({ text: 'Fetching tasks...', spinner: 'dots' }).start();
  try {
    const response = await requestWithRetry('get', url, null, config, 3, 2000, context);
    spinner.stop();
    return response.data;
  } catch (error) {
    spinner.fail(chalk.bold.redBright(` Failed to fetch tasks: ${error.message}`));
    return null;
  }
}

async function executeDailyCheckin(taskId, proxy, context, cookies) {
  const url = `https://api-mm.pip.world/xp/tasks/${taskId}`;
  const config = getAxiosConfig(proxy, {}, cookies, false);
  config.validateStatus = (status) => status >= 200 && status < 500;
  const spinner = ora({ text: 'Executing daily check-in...', spinner: 'dots' }).start();
  try {
    const response = await requestWithRetry('post', url, {}, config, 3, 2000, context);
    if (response.status === 400 || !response.data.success) {
      spinner.warn(chalk.bold.yellowBright(` ${response.data.message || 'Already checked in today'}`));
      return { success: false, message: response.data.message || 'Already claimed' };
    }
    spinner.succeed(chalk.bold.greenBright(` Check-In Successful! XP: ${response.data.xp}`));
    return { success: true };
  } catch (error) {
    spinner.fail(chalk.bold.redBright(` Failed to execute check-in: ${error.message}`));
    return null;
  }
}

async function getAccountInfo(proxy, context, cookies) {
  const url = 'https://api-mm.pip.world/account';
  const config = getAxiosConfig(proxy, {}, cookies, false);
  const spinner = ora({ text: 'Retrieving account info...', spinner: 'dots' }).start();
  try {
    const response = await requestWithRetry('get', url, null, config, 3, 2000, context);
    spinner.stop();
    if (response.data.username && response.data.xp) {
      return {
        username: response.data.username,
        points: response.data.xp.score,
        level: response.data.xp.level
      };
    } else {
      logger.warn('No account info found.', { emoji: '⚠️ ', context });
      return null;
    }
  } catch (error) {
    spinner.fail(chalk.bold.redBright(` Failed to retrieve account info: ${error.message}`));
    return null;
  }
}

async function getPublicIP(proxy, context) {
  try {
    const config = getAxiosConfig(proxy, {}, [], false);
    const response = await requestWithRetry('get', 'https://api.ipify.org?format=json', null, config, 3, 2000, context);
    return response.data.ip || 'Unknown';
  } catch (error) {
    logger.error(`Failed to get IP: ${error.message}`, { emoji: '❌ ', context });
    return 'Error retrieving IP';
  }
}

async function processAccount(account, index, total, proxy) {
  const context = `Account ${index + 1}/${total}`;
  logger.info(chalk.bold.magentaBright(`Starting account processing`), { emoji: '🚀 ', context });

  const { privateKey } = account;
  const address = deriveWalletAddress(privateKey);
  if (!address) {
    logger.error('Invalid private key', { emoji: '❌ ', context });
    return;
  }

  printHeader(`Account Info ${context}`);
  printInfo('Masked Address', maskAddress(address), context);
  const ip = await getPublicIP(proxy, context);
  printInfo('IP', ip, context);
  console.log('\n');

  try {
    logger.info('Starting authentication process...', { emoji: '🔐 ', context });
    const nonce = await initSIWE(address, proxy, context);
    if (!nonce) return;

    const token = await authenticateSIWE(privateKey, address, nonce, proxy, context);
    if (!token) return;

    const cookies = [
      `privy-token=${token}`,
      'privy-session=privy.pip.world'
    ];

    logger.info(chalk.bold.greenBright(`Login Successfully`), { emoji: '✅ ', context });

    console.log('\n');
    
    logger.info('Starting Checkin Process...', { emoji: '🛎️ ', context });
    const tasks = await getTasks(proxy, context, cookies);
    if (!tasks) return;

    const dailyTask = tasks.find(task => task.name === 'DAILY CHECK-IN');
    if (!dailyTask) {
      logger.error('Daily check-in task not found.', { emoji: '❌ ', context });
      return;
    }

    if (dailyTask.done) {
      logger.warn(chalk.bold.yellowBright('Already Check-In Today.'), { emoji: '⚠️ ', context });
    } else {
      const checkinResult = await executeDailyCheckin(dailyTask.id, proxy, context, cookies);
      if (checkinResult && checkinResult.success) {
        await delay(5);
      }
    }

    const accountInfo = await getAccountInfo(proxy, context, cookies);
    if (accountInfo) {
      printProfileInfo(accountInfo.username, accountInfo.points, accountInfo.level, context);
    }

    logger.info(chalk.bold.greenBright(`Completed account processing`), { emoji: '🎉 ', context });
    console.log(chalk.cyanBright('________________________________________________________________________________'));
  } catch (error) {
    logger.error(`Error processing account: ${error.message}`, { emoji: '❌ ', context });
  }
}

let globalUseProxy = false;
let globalProxies = [];

async function initializeConfig() {
  const useProxyAns = await askQuestion(chalk.cyanBright('🔌 Do You Want to Use Proxy? (y/n): '));
  if (useProxyAns.trim().toLowerCase() === 'y') {
    globalUseProxy = true;
    globalProxies = await readProxies();
    if (globalProxies.length === 0) {
      globalUseProxy = false;
      logger.warn('No proxies available, proceeding without proxy.', { emoji: '⚠️ ' });
    }
  } else {
    logger.info('Proceeding without proxy.', { emoji: 'ℹ️ ' });
  }
}

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function runCycle() {
  const accounts = await readAccounts();
  if (accounts.length === 0) {
    logger.error('No accounts found in pk.txt. Exiting cycle.', { emoji: '❌ ' });
    return;
  }

  for (let i = 0; i < accounts.length; i++) {
    const proxy = globalUseProxy ? globalProxies[i % globalProxies.length] : null;
    try {
      await processAccount(accounts[i], i, accounts.length, proxy);
    } catch (error) {
      logger.error(`Error processing account: ${error.message}`, { emoji: '❌ ', context: `Account ${i + 1}/${accounts.length}` });
    }
    if (i < accounts.length - 1) {
      console.log('\n\n');
    }
    await delay(5);
  }
}

async function run() {
  const terminalWidth = process.stdout.columns || 80;
  cfonts.say('NT EXHAUST', {
    font: 'block',
    align: 'center',
    colors: ['cyan', 'magenta'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: true
  });
  console.log(gradient.retro(centerText('=== Telegram Channel 🚀 : NT Exhaust (@NTExhaust) ===', terminalWidth)));
  console.log(gradient.retro(centerText('✪ BOT MAVERICK AUTO CHECK-IN ✪', terminalWidth)));
  console.log('\n');
  await initializeConfig();

  while (true) {
    await runCycle();
    console.log();
    logger.info(chalk.bold.yellowBright('Cycle completed. Waiting 24 hours...'), { emoji: '🔄 ' });
    await delay(86400);
  }
}

run().catch(error => logger.error(`Fatal error: ${error.message}`, { emoji: '❌' }));