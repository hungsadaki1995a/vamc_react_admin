import type { ThemeConfig } from 'antd';

export const APP_THEME: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
  },
  components: {
    DatePicker: {
      colorPrimary: '#005be2',
      borderRadius: 4,
      cellHeight: 24,
      cellWidth: 24,
      withoutTimeCellHeight: 24,
      cellHoverBg: '#f6f6f9',
      cellActiveWithRangeBg: '#eaf8ff',
      cellHoverWithRangeBg: '#d5ebff',
    },
  },
};
