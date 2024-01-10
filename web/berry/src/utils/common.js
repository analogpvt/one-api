import { enqueueSnackbar } from 'notistack';
import { snackbarConstants } from 'constants/SnackbarConstants';
import { API } from './api';

export function getSystemName() {
  let system_name = localStorage.getItem('system_name');
  if (!system_name) return 'One API';
  return system_name;
}

export function isMobile() {
  return window.innerWidth <= 600;
}

// eslint-disable-next-line
export function SnackbarHTMLContent({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

export function getSnackbarOptions(variant) {
  let options = snackbarConstants.Common[variant];
  if (isMobile()) {
    // 合并 options 和 snackbarConstants.Mobile
    options = { ...options, ...snackbarConstants.Mobile };
  }
  return options;
}

export function showError(error) {
  if (error.message) {
    if (error.name === 'AxiosError') {
      switch (error.response.status) {
        case 429:
          enqueueSnackbar('错误：请求次数过多，请稍后再试！', getSnackbarOptions('ERROR'));
          break;
        case 500:
          enqueueSnackbar('错误：服务器内部错误，请联系管理员！', getSnackbarOptions('ERROR'));
          break;
        case 405:
          enqueueSnackbar('本站仅作演示之用，无服务端！', getSnackbarOptions('INFO'));
          break;
        default:
          enqueueSnackbar('错误：' + error.message, getSnackbarOptions('ERROR'));
      }
      return;
    }
  } else {
    enqueueSnackbar('错误：' + error, getSnackbarOptions('ERROR'));
  }
}

export function showNotice(message, isHTML = false) {
  if (isHTML) {
    enqueueSnackbar(<SnackbarHTMLContent htmlContent={message} />, getSnackbarOptions('INFO'));
  } else {
    enqueueSnackbar(message, getSnackbarOptions('INFO'));
  }
}

export function showWarning(message) {
  enqueueSnackbar(message, getSnackbarOptions('WARNING'));
}

export function showSuccess(message) {
  enqueueSnackbar(message, getSnackbarOptions('SUCCESS'));
}

export function showInfo(message) {
  enqueueSnackbar(message, getSnackbarOptions('INFO'));
}

export async function getOAuthState() {
  const res = await API.get('/api/oauth/state');
  const { success, message, data } = res.data;
  if (success) {
    return data;
  } else {
    showError(message);
    return '';
  }
}

export async function onGitHubOAuthClicked(github_client_id, openInNewTab = false) {
  const state = await getOAuthState();
  if (!state) return;
  let url = `https://github.com/login/oauth/authorize?client_id=${github_client_id}&state=${state}&scope=user:email`;
  if (openInNewTab) {
    window.open(url);
  } else {
    window.location.href = url;
  }
}

export async function onGoogleOAuthClicked(google_client_id, openInNewTab = false) {
  let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google_client_id}&redirect_uri=${window.location.origin}/oauth/google&response_type=code&scope=profile`;
  if (openInNewTab) {
    window.open(url);
  } else {
    window.location.href = url;
  }
}

export async function onDiscordOAuthClicked({
  discord_client_id,
  discord_check_guild,
  discord_check_role,
}, openInNewTab = false) {
  const checkGuildQuery = discord_check_guild ? `%20guilds` : '';
  const checkRoleQuery = discord_check_role ? `%20guilds.members.read` : '';
  let url =
    `https://discord.com/oauth2/authorize?response_type=code&client_id=${discord_client_id}&redirect_uri=${window.location.origin}/oauth/discord&scope=identify` + checkGuildQuery + checkRoleQuery;

  if (openInNewTab) {
    window.open(url);
  } else {
    window.location.href = url;
  }
}

export function isAdmin() {
  let user = localStorage.getItem('user');
  if (!user) return false;
  user = JSON.parse(user);
  return user.role >= 10;
}

export function timestamp2string(timestamp) {
  let date = new Date(timestamp * 1000);
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  let second = date.getSeconds().toString();
  if (month.length === 1) {
    month = '0' + month;
  }
  if (day.length === 1) {
    day = '0' + day;
  }
  if (hour.length === 1) {
    hour = '0' + hour;
  }
  if (minute.length === 1) {
    minute = '0' + minute;
  }
  if (second.length === 1) {
    second = '0' + second;
  }
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
}

export function calculateQuota(quota, digits = 2) {
  let quotaPerUnit = localStorage.getItem('quota_per_unit');
  quotaPerUnit = parseFloat(quotaPerUnit);

  return (quota / quotaPerUnit).toFixed(digits);
}

export function renderQuota(quota, digits = 2) {
  let displayInCurrency = localStorage.getItem('display_in_currency');
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return '$' + calculateQuota(quota, digits);
  }
  return renderNumber(quota);
}

export const verifyJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export function renderNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 10000) {
    return (num / 1000).toFixed(1) + 'k';
  } else {
    return num;
  }
}

export function renderQuotaWithPrompt(quota, digits) {
  let displayInCurrency = localStorage.getItem('display_in_currency');
  displayInCurrency = displayInCurrency === 'true';
  if (displayInCurrency) {
    return `（等价金额：${renderQuota(quota, digits)}）`;
  }
  return '';
}

export function downloadTextAsFile(text, filename) {
  let blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export function removeTrailingSlash(url) {
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  } else {
    return url;
  }
}
