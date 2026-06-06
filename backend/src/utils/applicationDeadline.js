const isApplicationOpen = (applicationCloseAt) => {
  if (!applicationCloseAt) {
    return true;
  }

  return new Date() < new Date(applicationCloseAt);
};

const applicationClosedMessage = (applicationCloseAt) => {
  const closeDate = new Date(applicationCloseAt).toLocaleString();
  return `Applications closed on ${closeDate}. Resume changes are no longer allowed.`;
};

module.exports = {
  isApplicationOpen,
  applicationClosedMessage
};
