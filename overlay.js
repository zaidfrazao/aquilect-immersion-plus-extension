let injectionPoint = document.getElementById('watch-page-skeleton');
if (!injectionPoint) injectionPoint = document.getElementById('appMountPoint');
if (!injectionPoint)
  injectionPoint = document.getElementsByClassName('discordContainer')[0];

let globalWrapper = document.createElement('div');
let outerWrapper = document.createElement('div');
let contentWrapper = document.createElement('div');
outerWrapper.setAttribute('id', 'aqGlobalWrapper');
contentWrapper.setAttribute('id', 'aqContentWrapper');
globalWrapper.appendChild(outerWrapper);

let header = document.createElement('div');
outerWrapper.appendChild(header);

let headerText = document.createElement('h1');
header.appendChild(headerText);
header.setAttribute('id', 'aqHeader');
headerText.innerHTML = 'Aquilect Immersion+';

let loadingWrapper = document.createElement('div');
let loadingWrapperText = document.createElement('span');
loadingWrapper.setAttribute('id', 'aqLoadingWrapper');
loadingWrapperText.innerHTML = 'Loading...';
loadingWrapper.appendChild(loadingWrapperText);
outerWrapper.appendChild(loadingWrapper);

let buttonGroup = document.createElement('div');
buttonGroup.setAttribute('id', 'aqButtonGroup');
let activeImmersionButton = document.createElement('button');
activeImmersionButton.setAttribute('id', 'activeImmersionButton');
activeImmersionButton.setAttribute('class', 'groupedActive');
activeImmersionButton.innerHTML = 'active';
let passiveImmersionButton = document.createElement('button');
passiveImmersionButton.setAttribute('id', 'passiveImmersionButton');
passiveImmersionButton.setAttribute('class', 'groupedInactive');
passiveImmersionButton.innerHTML = 'passive';
buttonGroup.appendChild(activeImmersionButton);
buttonGroup.appendChild(passiveImmersionButton);
contentWrapper.appendChild(buttonGroup);

let todayText = document.createElement('span');
todayText.setAttribute('id', 'aqTodayText');
todayText.innerHTML = 'Today';
contentWrapper.appendChild(todayText);

let timer = document.createElement('div');
timer.setAttribute('id', 'aqTimer');
timer.innerHTML = '00:00:00';
contentWrapper.appendChild(timer);

let timerButton = document.createElement('button');
timerButton.setAttribute('id', 'aqTimerButton');
timerButton.innerHTML = 'Start Session';
contentWrapper.appendChild(timerButton);

outerWrapper.appendChild(contentWrapper);
injectionPoint.insertAdjacentHTML('beforebegin', globalWrapper.innerHTML);

let activeImmersionButtonDom = document.getElementById('activeImmersionButton');
let passiveImmersionButtonDom = document.getElementById(
  'passiveImmersionButton'
);
let timerButtonDom = document.getElementById('aqTimerButton');
let timerDom = document.getElementById('aqTimer');
let globalWrapperDom = document.getElementById('aqGlobalWrapper');
let contentWrapperDom = document.getElementById('aqContentWrapper');
let loadingWrapperDom = document.getElementById('aqLoadingWrapper');
let headerDom = document.getElementById('aqHeader');

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
let isMinimized = false;

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

  timerDom.innerText = `${hours < 10 ? '0' + hours : hours}:${
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
  timerButtonDom.innerText = 'Start Session';

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
  loadingWrapperDom.style.display = 'none';
  contentWrapperDom.style.display = 'block';
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
      activeImmersionButtonDom.className = 'groupedActive';
      passiveImmersionButtonDom.className = 'groupedInactive';
    } else {
      passiveImmersionButtonDom.className = 'groupedActive';
      activeImmersionButtonDom.className = 'groupedInactive';
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
    } else {
      timerButton.innerText = 'End Session';
    }

    if (isStateReady()) {
      initializeUi();
    }
  });
};

const handleActiveImmersionToggle = () => {
  activeImmersionButtonDom.addEventListener('click', async () => {
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
    activeImmersionButtonDom.className = 'groupedActive';
    passiveImmersionButtonDom.className = 'groupedInactive';
  });
};

const handlePassiveImmersionToggle = () => {
  passiveImmersionButtonDom.addEventListener('click', async () => {
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
    passiveImmersionButtonDom.className = 'groupedActive';
    activeImmersionButtonDom.className = 'groupedInactive';
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
  timerButtonDom.addEventListener('click', async () => {
    if (cachedTimerStatus === 'PAUSED') {
      timerButtonDom.innerText = 'End Session';
      cachedTimerStatus = 'ACTIVE';
      startSession();
      startTimer();
    } else {
      timerButtonDom.innerText = 'Start Session';
      cachedTimerStatus = 'PAUSED';
      stopTimer();
    }
  });
};

const handleMinimizeClicks = () => {
  headerDom.addEventListener('click', async () => {
    if (isMinimized) {
      isMinimized = false;
      globalWrapperDom.className = '';
    } else {
      isMinimized = true;
      globalWrapperDom.className = 'minimized';
    }
  });
};

getImmersionType();
getTimerStatus();
getSession();
handleActiveImmersionToggle();
handlePassiveImmersionToggle();
handleTimerButtonClicks();
handleMinimizeClicks();
