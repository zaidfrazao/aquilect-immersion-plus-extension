let activeImmersionButton = document.getElementById('activeImmersionButton');
let passiveImmersionButton = document.getElementById('passiveImmersionButton');
let timerButton = document.getElementById('timerButton');
let timer = document.getElementById('timer');
let contentWrapper = document.getElementById('contentWrapper');
let loadingWrapper = document.getElementById('loadingWrapper');
let activeIndicator = document.getElementById('activeIndicator');

let cachedImmersionType = null;
let cachedTimerStatus = null;
let cachedSession = {
  type: undefined,
  status: undefined,
  startTime: undefined,
  endTime: undefined,
  sessionLengthMilliseconds: undefined,
};
let isSessionLoaded = false;
let cachedTotalImmersionTimeMilliseconds = null;

let timeElapsedMilliseconds = 0;
let timerCounter = null;

const updateTimerText = (sessionStartTime) => {
  let time = cachedTotalImmersionTimeMilliseconds;

  if (sessionStartTime !== undefined) {
    const timeNow = new Date();
    time =
      cachedTotalImmersionTimeMilliseconds +
      (timeNow - new Date(sessionStartTime));
  }
  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time - hours * 3600000) / 60000);
  const seconds = Math.floor((time - hours * 3600000 - minutes * 60000) / 1000);

  timer.innerText = `${hours < 10 ? '0' + hours : hours}:${
    minutes < 10 ? '0' + minutes : minutes
  }:${seconds < 10 ? '0' + seconds : seconds}`;
};

const updateTimer = () => {
  updateTimerText(cachedSession.startTime);
};

const startTimer = () => {
  timerCounter = setInterval(updateTimer, 1000);
};

const stopTimer = () => {
  clearInterval(timerCounter);
  cachedTimerStatus = 'PAUSED';
  timerButton.innerText = 'Start Session';
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
  chrome.runtime.sendMessage({
    type: 'end-session',
    session: cachedSession,
    oldTotalImmersionTimeMilliseconds: cachedTotalImmersionTimeMilliseconds,
  });
};

const isStateReady = () => {
  return (
    cachedTimerStatus !== null &&
    cachedImmersionType !== null &&
    cachedTotalImmersionTimeMilliseconds !== null &&
    isSessionLoaded
  );
};

const showContent = () => {
  loadingWrapper.style.display = 'none';
  contentWrapper.style.display = 'block';
};

const initializeUi = () => {
  showContent();
  updateTimerText(cachedSession.startTime);

  if (cachedTimerStatus === 'ACTIVE') {
    startTimer();
  }
};

const getSession = () => {
  chrome.storage.sync.get('currentSession', ({ currentSession }) => {
    cachedSession = currentSession;
    isSessionLoaded = true;

    if (isStateReady()) {
      initializeUi();
    }
  });
};

const getTotalImmersionTimeMilliseconds = (immersionType) => {
  if (immersionType === 'ACTIVE') {
    chrome.storage.sync.get(
      'totalActiveImmersionTimeMilliseconds',
      ({ totalActiveImmersionTimeMilliseconds }) => {
        cachedTotalImmersionTimeMilliseconds = totalActiveImmersionTimeMilliseconds;

        if (isStateReady()) {
          initializeUi();
        }
      }
    );
  } else {
    chrome.storage.sync.get(
      'totalPassiveImmersionTimeMilliseconds',
      ({ totalPassiveImmersionTimeMilliseconds }) => {
        cachedTotalImmersionTimeMilliseconds = totalPassiveImmersionTimeMilliseconds;

        if (isStateReady()) {
          initializeUi();
        }
      }
    );
  }
};

const getImmersionType = () => {
  chrome.storage.sync.get('immersionType', ({ immersionType }) => {
    cachedImmersionType = immersionType;
    getTotalImmersionTimeMilliseconds(immersionType);

    if (immersionType === 'ACTIVE') {
      activeImmersionButton.className = 'groupedActive';
      passiveImmersionButton.className = 'groupedInactive';
    } else {
      passiveImmersionButton.className = 'groupedActive';
      activeImmersionButton.className = 'groupedInactive';
    }

    if (isStateReady()) {
      initializeUi();
    }
  });
};

const getTimerStatus = () => {
  chrome.storage.sync.get('timerStatus', ({ timerStatus }) => {
    cachedTimerStatus = timerStatus;
    if (timerStatus === 'PAUSED') {
      timerButton.innerText = 'Start Session';
      activeIndicator.className = 'inactiveSession';
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
    } else {
      timerButton.innerText = 'End Session';
      activeIndicator.className = 'activeSession';
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
    }

    if (isStateReady()) {
      initializeUi();
    }
  });
};

const handleActiveImmersionToggle = () => {
  activeImmersionButton.addEventListener('click', async () => {
    if (cachedTimerStatus === 'ACTIVE') {
      stopTimer();
    }
    cachedSession = {
      type: undefined,
      status: undefined,
      startTime: undefined,
      endTime: undefined,
      sessionLengthMilliseconds: undefined,
    };
    cachedImmersionType = 'ACTIVE';
    getTotalImmersionTimeMilliseconds('ACTIVE');
    chrome.storage.sync.set({ immersionType: 'ACTIVE' });
    activeImmersionButton.className = 'groupedActive';
    passiveImmersionButton.className = 'groupedInactive';
    activeIndicator.className = 'inactiveSession';
  });
};

const handlePassiveImmersionToggle = () => {
  passiveImmersionButton.addEventListener('click', async () => {
    if (cachedTimerStatus === 'ACTIVE') {
      stopTimer();
    }
    cachedSession = {
      type: undefined,
      status: undefined,
      startTime: undefined,
      endTime: undefined,
      sessionLengthMilliseconds: undefined,
    };
    cachedImmersionType = 'PASSIVE';
    getTotalImmersionTimeMilliseconds('PASSIVE');
    chrome.storage.sync.set({ immersionType: 'PASSIVE' });
    passiveImmersionButton.className = 'groupedActive';
    activeImmersionButton.className = 'groupedInactive';
    activeIndicator.className = 'inactiveSession';
  });
};

const startSession = () => {
  const newSession = {
    type: cachedImmersionType,
    status: 'IN_PROGRESS',
    startTime: new Date().toISOString(),
    endTime: null,
    sessionLengthMilliseconds: null,
  };
  cachedSession = newSession;
  chrome.runtime.sendMessage({
    type: 'start-session',
    session: newSession,
  });
};

const handleTimerButtonClicks = () => {
  timerButton.addEventListener('click', async () => {
    if (cachedTimerStatus === 'PAUSED') {
      activeIndicator.className = 'activeSession';
      timerButton.innerText = 'End Session';
      cachedTimerStatus = 'ACTIVE';
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
      startSession();
      startTimer();
    } else {
      activeIndicator.className = 'inactiveSession';
      timerButton.innerText = 'Start Session';
      cachedTimerStatus = 'PAUSED';
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
      stopTimer();
    }
  });
};

getImmersionType();
getTimerStatus();
getSession();
handleActiveImmersionToggle();
handlePassiveImmersionToggle();
handleTimerButtonClicks();
