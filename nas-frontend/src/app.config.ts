export default defineAppConfig({
  pages: [
    'pages/files/index',
    'pages/login/index',
    'pages/file-detail/index',
    'pages/share-list/index',
    'pages/user/index',
    'pages/admin-users/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'NAS文件管理',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/files/index',
        text: '文件',
        iconPath: 'assets/icons/file.png',
        selectedIconPath: 'assets/icons/file-active.png'
      },
      {
        pagePath: 'pages/share-list/index',
        text: '分享',
        iconPath: 'assets/icons/share.png',
        selectedIconPath: 'assets/icons/share-active.png'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的',
        iconPath: 'assets/icons/user.png',
        selectedIconPath: 'assets/icons/user-active.png'
      }
    ]
  }
});
