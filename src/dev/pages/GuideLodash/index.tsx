import { Typography, Card, Divider, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import _ from 'lodash';
import { menuConfig } from '@/config/menuConfig';
import type { MenuItem } from '@/types/menu';

const { Title, Paragraph, Text } = Typography;

// Flatten menu items using _.map (example usage)
const topLevelMenus = _.map(menuConfig, (item: MenuItem) => ({
  key: item.key,
  label: item.label,
  childCount: item.children?.length ?? 0,
}));

const columns: TableColumnsType<(typeof topLevelMenus)[0]> = [
  { title: 'Key', dataIndex: 'key', key: 'key', render: (v) => <Text code>{v}</Text> },
  { title: '레이블', dataIndex: 'label', key: 'label' },
  { title: '자식 수', dataIndex: 'childCount', key: 'childCount' },
];

export default function GuideLodash() {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const chunked = _.chunk(numbers, 3);
  const grouped = _.groupBy(['one', 'two', 'three', 'four'], 'length');

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Lodash 가이드</Title>
      <Paragraph>Lodash는 배열, 객체, 문자열, 함수를 다루는 유틸리티 라이브러리입니다.</Paragraph>

      <Divider titlePlacement="left">menuConfig를 _.map으로 처리</Divider>
      <Table
        dataSource={topLevelMenus}
        columns={columns}
        size="small"
        pagination={false}
      />

      <Divider titlePlacement="left">배열 유틸리티</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`_.chunk([1,2,3,4,5], 2)          // [[1,2],[3,4],[5]]
// 결과: ${JSON.stringify(chunked)}

_.groupBy(['one','two','three','four'], 'length')
// 결과: ${JSON.stringify(grouped)}

_.uniq([1,2,2,3,3,3])            // [1,2,3]
_.flatten([[1,2],[3,4]])          // [1,2,3,4]
_.flatMap([{a:[1,2]},{a:[3]}], 'a') // [1,2,3]
_.orderBy(data, ['name','age'], ['asc','desc'])
_.intersection([1,2,3],[2,3,4])  // [2,3]
_.difference([1,2,3],[2,3,4])    // [1]`}</pre>
      </Card>

      <Divider titlePlacement="left">객체 유틸리티</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`_.pick(obj, ['id','name'])        // 특정 키만 추출
_.omit(obj, ['password'])        // 특정 키 제외
_.merge({a:1}, {b:2})            // 깊은 병합
_.cloneDeep(obj)                 // 깊은 복사
_.get(obj, 'a.b.c', defaultVal)  // 안전한 중첩 접근
_.set(obj, 'a.b.c', value)       // 중첩 경로 설정
_.isEmpty(obj)                   // 빈 객체/배열 확인`}</pre>
      </Card>

      <Divider titlePlacement="left">함수 유틸리티</Divider>
      <Card>
        <pre style={{ margin: 0, fontSize: 13 }}>{`// 검색 입력 디바운스
const onSearch = _.debounce((value) => {
  fetchResults(value);
}, 300);

// 스크롤 핸들러 쓰로틀
const onScroll = _.throttle(() => {
  checkScroll();
}, 100);

// 한 번만 실행
const init = _.once(() => { /* 초기화 */ });`}</pre>
      </Card>
    </div>
  );
}
