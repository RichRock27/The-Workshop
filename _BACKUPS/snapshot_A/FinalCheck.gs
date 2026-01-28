function checkHub() {
  const hubId = '1PZA9tvrtFzpPIo-fteXt8VKCGEC9j4ZK';
  const hub = DriveApp.getFolderById(hubId);
  const folders = hub.getFolders();
  const list = [];
  while (folders.hasNext()) {
    list.push(folders.next().getName());
  }
  Logger.log("COUNT: " + list.length);
  Logger.log("PROJECTS: " + list.sort().join(", "));
  return list.length + " projects found.";
}
