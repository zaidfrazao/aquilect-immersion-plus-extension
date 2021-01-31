chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    immersionType: 'ACTIVE',
    timerStatus: 'PAUSED',
    totalActiveImmersionTimeMilliseconds: 0,
    totalPassiveImmersionTimeMilliseconds: 0,
    currentSession: {
      type: undefined,
      status: undefined,
      startTime: undefined,
      endTime: undefined,
      sessionLengthMilliseconds: undefined,
    },
  });
  chrome.action.setBadgeText({ text: 'OFF' });
  chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get('timerStatus', ({ timerStatus }) => {
    if (timerStatus === 'PAUSED') {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#c62828' });
    } else {
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });
    }
  });
});

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'end-session') {
    const endTime = new Date();
    const sessionLengthMilliseconds =
      endTime - new Date(request.session.startTime);
    let totalImmersionTimeMilliseconds =
      request.oldTotalImmersionTimeMilliseconds + sessionLengthMilliseconds;

    console.log({
      ...request.session,
      status: 'COMPLETE',
      endTime: endTime.toISOString(),
      sessionLengthMilliseconds,
    });

    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#c62828' });

    if (request.session.type === 'ACTIVE') {
      chrome.storage.sync.set({
        timerStatus: 'PAUSED',
        totalActiveImmersionTimeMilliseconds: totalImmersionTimeMilliseconds,
        currentSession: {
          type: undefined,
          status: undefined,
          startTime: undefined,
          endTime: undefined,
          sessionLengthMilliseconds: undefined,
        },
      });
    } else {
      chrome.storage.sync.set({
        timerStatus: 'PAUSED',
        totalPassiveImmersionTimeMilliseconds: totalImmersionTimeMilliseconds,
        currentSession: {
          type: undefined,
          status: undefined,
          startTime: undefined,
          endTime: undefined,
          sessionLengthMilliseconds: undefined,
        },
      });
    }
  } else if (request.type === 'start-session') {
    chrome.action.setBadgeText({ text: 'ON' });
    chrome.action.setBadgeBackgroundColor({ color: '#2e7d32' });

    chrome.storage.sync.set({
      timerStatus: 'ACTIVE',
      currentSession: request.session,
    });
  } else if (request.type === 'debug') {
    console.log(request.message);
  }
});
