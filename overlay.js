let injectionPoint = document.getElementById('watch-page-skeleton');
if (!injectionPoint) injectionPoint = document.getElementById('player');
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

let activeIndicator = document.createElement('span');
let arrowIndicator = document.createElement('span');
let headerText = document.createElement('h1');
let headerTextInner = document.createElement('span');
header.appendChild(headerText);
header.setAttribute('id', 'aqHeader');
headerText.appendChild(activeIndicator);
headerText.appendChild(headerTextInner);
headerText.appendChild(arrowIndicator);
activeIndicator.setAttribute('id', 'aqActiveIndicator');
activeIndicator.setAttribute('class', 'inactiveSession');
activeIndicator.innerHTML = '&#9679';
arrowIndicator.setAttribute('id', 'aqArrowIndicator');
arrowIndicator.innerHTML = '&#11167';
headerTextInner.innerHTML = 'Aquilect Immersion+';

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
let studyButton = document.createElement('button');
studyButton.setAttribute('id', 'studyButton');
studyButton.setAttribute('class', 'groupedInactive');
studyButton.innerHTML = 'study';
buttonGroup.appendChild(activeImmersionButton);
buttonGroup.appendChild(passiveImmersionButton);
buttonGroup.appendChild(studyButton);
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
let studyButtonDom = document.getElementById('studyButton');
let timerButtonDom = document.getElementById('aqTimerButton');
let timerDom = document.getElementById('aqTimer');
let globalWrapperDom = document.getElementById('aqGlobalWrapper');
let contentWrapperDom = document.getElementById('aqContentWrapper');
let loadingWrapperDom = document.getElementById('aqLoadingWrapper');
let headerDom = document.getElementById('aqHeader');
let activeIndicatorDom = document.getElementById('aqActiveIndicator');
let arrowIndicatorDom = document.getElementById('aqArrowIndicator');

let cachedImmersionType = null;
let cachedTimerStatus = null;
let cachedSession = {
  type: undefined,
  status: undefined,
  startTime: undefined,
  endTime: undefined,
};
let cachedTotalImmersionTimeMilliseconds = null;
let isSessionLoaded = false;

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
  const startTime = cachedSession.startTime;
  const endTime = new Date().toISOString();

  clearInterval(timerCounter);
  cachedTimerStatus = 'PAUSED';
  timerButtonDom.innerText = 'Start Session';

  chrome.runtime.sendMessage({
    type: 'end-session',
    session: cachedSession,
    oldTotalImmersionTimeMilliseconds: cachedTotalImmersionTimeMilliseconds,
  });

  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    `https://us-central1-aquilect.cloudfunctions.net/endSession?startTime=${startTime}&endTime=${endTime}`,
    true
  );
  xhr.send();
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
  } else if (immersionType === 'PASSIVE') {
    chrome.storage.sync.get(
      'totalPassiveImmersionTimeMilliseconds',
      ({ totalPassiveImmersionTimeMilliseconds }) => {
        cachedTotalImmersionTimeMilliseconds = totalPassiveImmersionTimeMilliseconds;

        if (isStateReady()) {
          initializeUi();
        }
      }
    );
  } else {
    chrome.storage.sync.get(
      'totalStudyTimeMilliseconds',
      ({ totalStudyTimeMilliseconds }) => {
        cachedTotalImmersionTimeMilliseconds = totalStudyTimeMilliseconds;

        if (isStateReady()) {
          initializeUi();
        }
      }
    );
  }
};

const updateImmersionType = (newImmersionType) => {
  cachedImmersionType = newImmersionType;
  getTotalImmersionTimeMilliseconds(newImmersionType);

  if (newImmersionType === 'ACTIVE') {
    activeImmersionButtonDom.className = 'groupedActive';
    passiveImmersionButtonDom.className = 'groupedInactive';
    studyButtonDom.className = 'groupedInactive';
  } else if (newImmersionType === 'PASSIVE') {
    passiveImmersionButtonDom.className = 'groupedActive';
    activeImmersionButtonDom.className = 'groupedInactive';
    studyButtonDom.className = 'groupedInactive';
  } else {
    studyButtonDom.className = 'groupedActive';
    activeImmersionButtonDom.className = 'groupedInactive';
    passiveImmersionButtonDom.className = 'groupedInactive';
  }
};

const getImmersionType = () => {
  chrome.storage.sync.get('immersionType', ({ immersionType }) => {
    updateImmersionType(immersionType);

    if (isStateReady()) {
      initializeUi();
    }
  });
};

const getTimerStatus = () => {
  chrome.storage.sync.get('timerStatus', ({ timerStatus }) => {
    cachedTimerStatus = timerStatus;
    if (timerStatus === 'PAUSED') {
      timerButtonDom.innerText = 'Start Session';
      activeIndicatorDom.className = 'inactiveSession';
    } else {
      timerButtonDom.innerText = 'End Session';
      activeIndicatorDom.className = 'activeSession';
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
    studyButtonDom.className = 'groupedInactive';
    activeImmersionButtonDom.className = 'groupedActive';
    passiveImmersionButtonDom.className = 'groupedInactive';
    activeIndicatorDom.className = 'inactiveSession';
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
    studyButtonDom.className = 'groupedInactive';
    passiveImmersionButtonDom.className = 'groupedActive';
    activeImmersionButtonDom.className = 'groupedInactive';
    activeIndicatorDom.className = 'inactiveSession';
  });
};

const handleStudyToggle = () => {
  studyButtonDom.addEventListener('click', async () => {
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
    cachedImmersionType = 'STUDY';
    getTotalImmersionTimeMilliseconds('STUDY');
    chrome.storage.sync.set({ immersionType: 'STUDY' });
    studyButtonDom.className = 'groupedActive';
    passiveImmersionButtonDom.className = 'groupedInactive';
    activeImmersionButtonDom.className = 'groupedInactive';
    activeIndicatorDom.className = 'inactiveSession';
  });
};

const startSession = () => {
  const startTime = new Date().toISOString();
  const newSession = {
    startTime,
    type: cachedImmersionType,
    status: 'IN_PROGRESS',
    endTime: null,
    sessionLengthMilliseconds: null,
  };
  cachedSession = newSession;
  chrome.runtime.sendMessage({
    type: 'start-session',
    session: newSession,
  });

  const xhr = new XMLHttpRequest();
  xhr.open(
    'GET',
    `https://us-central1-aquilect.cloudfunctions.net/startSession?type=${cachedImmersionType}&startTime=${startTime}&userId=OB3tFldo9DfCNYywzc7wHznCLGU2`,
    true
  );
  xhr.send();
};

const handleTimerButtonClicks = () => {
  timerButtonDom.addEventListener('click', async () => {
    if (cachedTimerStatus === 'PAUSED') {
      timerButtonDom.innerText = 'End Session';
      cachedTimerStatus = 'ACTIVE';
      startSession();
      startTimer();
      activeIndicatorDom.className = 'activeSession';
    } else {
      timerButtonDom.innerText = 'Start Session';
      cachedTimerStatus = 'PAUSED';
      stopTimer();
      activeIndicatorDom.className = 'inactiveSession';
    }
  });
};

const handleMinimizeClicks = () => {
  headerDom.addEventListener('click', async () => {
    if (isMinimized) {
      isMinimized = false;
      globalWrapperDom.className = '';
      arrowIndicatorDom.innerHTML = '&#11167';
    } else {
      isMinimized = true;
      globalWrapperDom.className = 'minimized';
      arrowIndicatorDom.innerHTML = '&#11165';
    }
  });
};

const checkForCacheUpdates = () => {
  chrome.storage.onChanged.addListener(() => {
    chrome.storage.sync.get(
      [
        'immersionType',
        'timerStatus',
        'totalActiveImmersionTimeMilliseconds',
        'totalPassiveImmersionTimeMilliseconds',
        'totalStudyTimeMilliseconds',
        'currentSession',
      ],
      (result) => {
        if (cachedImmersionType !== result.immersionType) {
          updateImmersionType(result.immersionType);
        }
        if (cachedTimerStatus !== result.timerStatus) {
          cachedTimerStatus = result.timerStatus;
          if (result.timerStatus === 'PAUSED') {
            activeIndicatorDom.className = 'inactiveSession';
            timerButtonDom.innerText = 'Start Session';
            cachedTimerStatus = 'PAUSED';
            cachedSession = {
              type: undefined,
              status: undefined,
              startTime: undefined,
              endTime: undefined,
              sessionLengthMilliseconds: undefined,
            };
            stopTimer();
          } else {
            activeIndicatorDom.className = 'activeSession';
            timerButtonDom.innerText = 'End Session';
            cachedTimerStatus = 'ACTIVE';
            cachedSession = result.currentSession;
            if (cachedImmersionType === 'ACTIVE') {
              cachedTotalImmersionTimeMilliseconds =
                result.totalActiveImmersionTimeMilliseconds;
            } else if (cachedImmersionType === 'PASSIVE') {
              cachedTotalImmersionTimeMilliseconds =
                result.totalPassiveImmersionTimeMilliseconds;
            } else {
              cachedTotalImmersionTimeMilliseconds =
                result.totalStudyTimeMilliseconds;
            }
            startTimer();
          }
        }
        if (
          cachedImmersionType === 'ACTIVE' &&
          cachedTotalImmersionTimeMilliseconds !==
            result.totalActiveImmersionTimeMilliseconds
        ) {
          cachedTotalImmersionTimeMilliseconds =
            result.totalActiveImmersionTimeMilliseconds;
        } else if (
          cachedImmersionType === 'PASSIVE' &&
          cachedTotalImmersionTimeMilliseconds !==
            result.totalPassiveImmersionTimeMilliseconds
        ) {
          cachedTotalImmersionTimeMilliseconds =
            result.totalPassiveImmersionTimeMilliseconds;
        } else if (
          cachedImmersionType === 'STUDY' &&
          cachedTotalImmersionTimeMilliseconds !==
            result.totalStudyTimeMilliseconds
        ) {
          cachedTotalImmersionTimeMilliseconds =
            result.totalStudyTimeMilliseconds;
        }
      }
    );
  });
};

getImmersionType();
getTimerStatus();
getSession();
handleActiveImmersionToggle();
handlePassiveImmersionToggle();
handleStudyToggle();
handleTimerButtonClicks();
handleMinimizeClicks();
checkForCacheUpdates();
