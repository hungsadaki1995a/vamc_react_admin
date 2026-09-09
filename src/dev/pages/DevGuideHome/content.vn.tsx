import { Code, Note, DataTable } from './parts';
import styles from './index.module.css';
import {
  TERMINAL, SQL_ROLE, CODE_EMPTY, CODE_API, CODE_LIST, CODE_CRUD,
  CODE_PERM, CODE_LABEL, CODE_STATE,
} from './snippets.vn';

const L = 'vn' as const;

// 코드 예시의 주석은 한국어다 — 저장소에 그대로 붙여 넣는 코드이고,
// 이 저장소의 주석 규약이 한국어이기 때문이다(snippets.ts 참조).

export const CONTENT_VN: Record<string, React.ReactNode> = {

  prepare: (
    <>
      <p className={styles.lead}>
        Để tạo màn hình, <b>backend và Redis phải đang chạy.</b>
        Nếu chỉ khởi động frontend thì sẽ lỗi ngay ở bước đăng nhập.
      </p>

      <Code file="Terminal" locale={L}>{TERMINAL}</Code>

      <p>
        Mở <span className={styles.path}>http://localhost:3000</span> và đăng nhập bằng
        <b> user01 / user123$</b>.
      </p>

      <Note type="warn" title="Bắt buộc dùng Redis cục bộ.">
        Nếu trỏ vào Redis của máy chủ phát triển, chỉ vài lần đăng nhập sai ở máy bạn sẽ
        <b> khoá tài khoản thật trên máy chủ phát triển trong 30 phút.</b>
      </Note>

      <Note title="Địa chỉ API backend">
        Để trống <code>VITE_API_BASE_URL</code> trong <span className={styles.path}>.env.local</span>,
        proxy của Vite sẽ chuyển các yêu cầu <code>/api</code> tới <code>http://127.0.0.1:8080</code>.
        Đây là giá trị mặc định nên thường không cần sửa.
      </Note>
    </>
  ),

  sceid: (
    <>
      <p className={styles.lead}>
        Một mã màn hình được dùng đồng thời làm <b>tên thư mục, MENU_URL_ADDR trong DB và tiền tố khoá nhãn</b>.
        Vì vậy hãy quyết định nó trước khi viết mã.
      </p>

      <p>
        Định dạng là <code>{'{miền3}{nhóm2}{nhómcon2}{sốthứtự2}{loại2}'}</code> — 11 ký tự,
        suy ra trực tiếp từ mã menu.
      </p>

      <Code locale={L}>{`Mã menu     A04  01  00  00     Quản lý nội dung > Quản lý thông báo
             │    │   │
Miền   (3) ──┘    │   │        A04 → CNT
Nhóm   (2) ───────┘   │
Nhóm con (2) ─────────┘
Số thứ tự (2) = 01, Loại (2) = SC

→ Mã màn hình = CNT010001SC`}</Code>

      <DataTable
        head={['Menu cấp 1', 'Mã menu', 'Miền']}
        rows={[
          ['Quản lý thành viên', <code>A01</code>, <code>MBR</code>],
          ['Quản lý giao dịch', <code>A02</code>, <code>TRD</code>],
          ['Quản lý thông tin NPL', <code>A03</code>, <code>NPL</code>],
          ['Quản lý nội dung', <code>A04</code>, <code>CNT</code>],
          ['Thống kê', <code>A05</code>, <code>STT</code>],
          ['Quản lý vận hành hệ thống', <code>A06</code>, <code>SYS</code>],
          ['Quản lý đấu giá', <code>A07</code>, <code>AUC</code>],
        ]}
      />

      <p>
        Loại là <code>SC</code> (màn hình gắn vào menu) hoặc
        <code> 1P</code>·<code>2P</code> (cửa sổ bật lên — mã màn hình cha kèm số thứ tự).
      </p>

      <Note type="danger" title="Đã đặt thì không đổi.">
        Ngay cả khi menu chuyển sang nhóm khác, vẫn giữ nguyên mã màn hình.
        Đổi nó sẽ <b>làm lệch toàn bộ khoá nhãn của màn hình đó</b> và hỏng hết phần đa ngôn ngữ.
      </Note>
    </>
  ),

  menu: (
    <>
      <p className={styles.lead}>
        Menu nằm ở <b>cơ sở dữ liệu, không phải trong mã</b>. Nhưng bạn không cần viết SQL —
        hãy thêm, sửa, xoá tại màn hình
        <span className={styles.path}>Quản lý vận hành hệ thống &gt; Quản lý menu Admin</span>.
      </p>

      <h4>Trước tiên kiểm tra menu đã tồn tại chưa</h4>
      <p>
        56 menu từ IA của bên hoạch định đã được nạp sẵn. Phần lớn <b>chưa có đường dẫn thành phần</b>,
        nên bấm vào sẽ hiện thông báo &quot;chưa triển khai&quot;.
        Nếu menu cho màn hình của bạn đã có, bạn chỉ cần điền đúng ô đó.
      </p>
      <p>
        Tìm mã menu <code>A04010000</code>, bấm vào dòng <b>Quản lý thông báo</b>, biểu mẫu bên dưới sẽ được điền.
        Nhập mã màn hình đã chọn — <code>CNT010001SC</code> — vào ô
        <b> Đường dẫn thành phần</b> rồi lưu.
      </p>

      <h4>Nếu menu chưa tồn tại — tạo mới</h4>
      <p>Xoá trắng biểu mẫu (Khởi tạo), nhập các giá trị dưới đây rồi lưu.</p>

      <DataTable
        head={['Trường', 'Giá trị', 'Ghi chú']}
        rows={[
          ['Mã menu', <code>A04070000</code>, 'Không đổi được sau khi tạo'],
          ['Tên menu (KR)', 'Quản lý mẫu', 'Giá trị dự phòng cho ngôn ngữ chưa có bản dịch'],
          ['Tên đa ngôn ngữ', 'Sample Mgmt', <>Lưu theo <b>ngôn ngữ đang tìm kiếm</b></>],
          ['Mã menu cha', <code>A04000000</code>, 'Bắt buộc'],
          ['Thứ tự menu', '7', 'Sắp xếp giữa các menu cùng cấp'],
          ['Cấp menu', '—', <><b>Máy chủ tính</b> từ menu cha</>],
          ['Đường dẫn thành phần', <code>CNT070001SC</code>, 'Mã màn hình. Bỏ trống nghĩa là "chưa triển khai"'],
          ['Mã nhãn', '—', <>Bỏ trống sẽ tự điền <code>lbl.menu.{'{'}mã menu{'}'}</code></>],
        ]}
      />

      <Note title="Một lần lưu ghi cả menu lẫn tên của nó.">
        Máy chủ xử lý dòng menu (<code>MENU_MNG</code>) và nhãn tên menu
        (<code>LANG_LBL</code> + <code>LANG_LBL_TRSL</code>) trong cùng một giao dịch.
        Không có nhãn thì tên menu hiện ra là <code>lbl.menu.…</code>, nên hai thứ không bao giờ tách rời.
      </Note>

      <h4>Nhập tên cho ngôn ngữ khác</h4>
      <p>
        <b>Tên đa ngôn ngữ được lưu theo ngôn ngữ trong điều kiện tìm kiếm.</b> Để nhập tên tiếng Anh,
        đổi <b>Ngôn ngữ</b> ở vùng tìm kiếm sang <code>EN</code>, tìm, bấm vào dòng đó,
        sửa tên đa ngôn ngữ rồi lưu. Tiếng Việt cũng làm tương tự.
      </p>

      <h4>Xoá</h4>
      <p>
        Chọn một dòng và xoá sẽ gỡ cả menu, ánh xạ vai trò và nhãn theo quy ước.
        <b> Sẽ bị từ chối nếu còn menu con</b> — menu con mất cha sẽ thành dòng không xuất hiện ở bất kỳ
        màn hình nào. Hãy xoá menu con trước.
      </p>

      <h4>Nếu tạo menu mới thì còn một bước nữa — cấp quyền (SQL)</h4>
      <p>
        <b>Lưu xong menu vẫn chưa hiện ra.</b> Cây menu được lấy bằng cách nối với quyền theo vai trò
        (<code>MENU_ROLE_MPNG</code>), mà menu mới thì chưa có ánh xạ nào.
      </p>
      <p>
        Việc cấp quyền thuộc về màn hình
        <span className={styles.path}>Quản lý vận hành hệ thống &gt; Quản lý Admin &gt; Quản lý quyền menu Admin</span>
        (<code>A06030400</code>), nhưng <b>màn hình này chưa được triển khai.</b> Trong lúc chờ, hãy dùng SQL.
      </p>

      <Code file="SQL — cấp quyền cho vai trò" locale={L}>{SQL_ROLE}</Code>

      <Note type="warn" title="Không cần bước này nếu chỉ gắn màn hình vào menu có sẵn.">
        56 menu đến từ IA đã có sẵn quyền ADMIN.
        Bước này <b>chỉ áp dụng khi bạn tạo menu mới</b>.
      </Note>

      <Note title="Khi màn hình Quản lý quyền menu Admin được xây xong">
        Đoạn SQL này sẽ chuyển vào màn hình đó. Màn hình đăng ký menu không đụng đến quyền — nếu quyền
        có thể được cấp ở hai nơi, <b>sẽ không ai giải thích được ai đã cấp quyền gì</b>.
        (Nhân tiện, xây màn hình đó chính là bài thực hành tốt cho hướng dẫn này.)
      </Note>

      <Note type="warn" title="Nếu chưa thấy ngay thì đó là bộ nhớ đệm.">
        Khi lưu, bộ nhớ đệm menu phía máy chủ được xoá, nhưng thanh menu bên trái còn được đệm ở trình duyệt.
        <b> Đăng xuất rồi đăng nhập lại</b> cho chắc.
      </Note>

      <Note type="danger" title="Tài khoản DB của lập trình viên chỉ chạy được DML.">
        <code>CREATE / ALTER / DROP</code> bị chặn ở máy chủ.
        <code> CREATE command denied</code> là hành vi bình thường, không phải lỗi.
        Cần bảng mới thì đề nghị DA.
      </Note>
    </>
  ),

  empty: (
    <>
      <p className={styles.lead}>
        <b>Đặt tên thư mục theo mã màn hình là xong.</b> Không cần đăng ký ở đâu cả —
        <code> componentRegistry</code> tự tìm <code>src/features/*/*/index.tsx</code>.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx" locale={L}>{CODE_EMPTY}</Code>

      <p>Lưu lại, bấm vào menu, một tab sẽ mở ra với màn hình này. Đến đây là đã nối dây xong.</p>

      <DataTable
        head={['Quy tắc', 'Lý do']}
        rows={[
          [<>Thư mục có hai cấp: <code>features/{'{miền}'}/{'{mã màn hình}'}/</code></>,
           'Glob cố định hai cấp; sâu hơn sẽ không được phát hiện'],
          [<>Cửa sổ bật lên đặt ở thư mục con <code>{'{mã màn hình}'}/{'{mã màn hình}'}1P/</code></>,
           'Ba cấp nên tự động bị loại — cố ý, để chúng không mở được từ menu'],
          [<>Demo và mẫu đặt ở <code>src/dev/pages/</code></>,
           'Bị loại hoàn toàn khỏi bản dựng vận hành'],
        ]}
      />

      <Note type="warn" title='Nếu hiện "chưa triển khai" thay vì màn hình của bạn'>
        Kiểm tra tên thư mục và <code>MENU_URL_ADDR</code> có <b>trùng từng ký tự</b> không.
        Chữ hoa chữ thường cũng được phân biệt.
      </Note>
    </>
  ),

  api: (
    <>
      <p className={styles.lead}>
        Mã gọi API đặt ở <code>src/api/{'{miền}'}/{'{nghiệp vụ}'}Api.ts</code>, <b>không có ngoại lệ</b>.
        Đừng tạo <code>api.ts</code> trong thư mục màn hình — ngay khi màn hình khác cần cùng API,
        nó sẽ import từ một màn hình, và từ đó không ai biết bản gốc nằm ở đâu.
      </p>

      <Code file="src/api/cnt/noticeApi.ts" locale={L}>{CODE_API}</Code>

      <Note type="danger" title="Đừng quên chuyển đổi status → success.">
        Máy chủ chỉ trả về <code>{'{ status, message, data }'}</code> — không có trường <code>success</code>.
        <code> useApiQuery / useApiMutation</code> xét thành công theo <code>success === true</code>, nên nếu bỏ
        qua bước chuyển đổi thì <b>phản hồi thành công cũng bị coi là thất bại.</b>
      </Note>

      <Note title="Luôn thêm tiền tố /api vào đường dẫn.">
        <code>baseURL</code> để trống nên proxy của Vite chỉ chuyển tiếp yêu cầu bắt đầu bằng <code>/api</code>.
      </Note>

      <h4>Quy tắc đặt tên tệp</h4>
      <ul>
        <li>Thêm hậu tố <code>Api</code> để <b>chỉ nhìn tên tệp là biết đó là tệp API</b>.</li>
        <li>Phần đầu là <b>tên nghiệp vụ</b>, không phải mã màn hình — <code>noticeApi.ts</code>, <code>lblMngApi.ts</code>.</li>
        <li><b>Cấm viết tắt một từ</b> (<code>usr.ts</code>, <code>lbl.ts</code>). Khi cùng một tài nguyên có
          tệp tra cứu và tệp quản lý, chúng sẽ không phân biệt được.</li>
      </ul>

      <h4>Nếu endpoint máy chủ chưa có</h4>
      <p>
        Màn hình sẽ hiện danh sách rỗng và có toast 404. Hãy thêm endpoint vào API quản trị
        (<code>vamc-npl-admin-backend</code>) theo thứ tự sau. Quy tắc chi tiết nằm trong
        <code> README.md</code> của kho đó.
      </p>
      <Code locale={L}>{`1. dto/        DTO yêu cầu/phản hồi (kèm annotation validation)
2. domain/     Entity
3. mapper/     Giao diện Mapper + XML
4. service/    Service (@Transactional)
5. controller/ Controller (annotation Swagger + @Valid)
   → Phản hồi thành công bắt buộc bọc trong ApiResponse<T>
   → API ghi phải gọi permissionGuard.assertMenuWrite(authentication, "A04010000")`}</Code>
    </>
  ),

  list: (
    <>
      <p className={styles.lead}>
        Bộ khung màn hình gồm ba khối từ trên xuống: <b>tìm kiếm → lưới → biểu mẫu</b>.
        Bố cục do các thành phần chung đảm nhiệm, nên đừng tự viết flex trong màn hình.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx" locale={L}>{CODE_LIST}</Code>

      <DataTable
        head={['Thành phần', 'Vai trò']}
        rows={[
          [<code>FilterPanel</code>, 'Vùng tìm kiếm. Tự cung cấp nút Tìm kiếm và Khởi tạo'],
          [<code>{'<div className="page-body">'}</code>, 'Lớp chuẩn chuyển phần chiều cao còn lại cho nội dung'],
          [<code>GridPanel</code>, 'Thanh công cụ (số dòng, nút) + AG Grid'],
          [<code>useApiQuery</code>, <>Bóc <code>ApiResponse</code> và chỉ trả về <code>data</code></>],
        ]}
      />

      <Note title="Tìm kiếm thực hiện ở máy chủ.">
        Đừng tải toàn bộ rồi <code>filter()</code> trên màn hình. Hiện tại chạy được vì dữ liệu ít,
        nhưng khi số dòng tăng thì đó là sự cố. Đặt điều kiện vào <code>queryKey</code> —
        React Query sẽ tự truy vấn lại khi điều kiện đổi.
      </Note>

      <Note title="Nếu muốn chia lưới trái phải">
        Dùng <code>SplitPanel</code>. Nó có sẵn thanh kéo thay đổi kích thước, và tiêu đề vùng thì đưa vào
        thuộc tính <code>title</code> của <code>GridPanel</code>.
      </Note>
    </>
  ),

  crud: (
    <>
      <p className={styles.lead}>
        Gắn <code>FormPanel</code> bên dưới lưới, và điền vào biểu mẫu khi bấm một dòng.
        <b> Thêm mới và sửa dùng chung một biểu mẫu</b>, phân biệt bằng việc có dòng nào đang được chọn hay không.
      </p>

      <Code file="src/features/cnt/CNT010001SC/index.tsx (tiếp)" locale={L}>{CODE_CRUD}</Code>

      <h4>Ba điều bắt buộc</h4>
      <DataTable
        head={['Hạng mục', 'Lý do']}
        rows={[
          [<>Sau khi lưu gọi <code>invalidateQueries</code> (theo tiền tố)</>,
           <><code>refetch()</code> chỉ làm mới bộ đệm của điều kiện hiện tại; đổi điều kiện rồi tìm lại sẽ ra dữ liệu cũ</>],
          [<>Không gắn <code>onError</code></>,
           <>Interceptor của <code>apiClient</code> đã hiện toast lỗi. Gắn thêm sẽ hiện hai lần</>],
          [<>Nút dùng <code>ActionButtonGroup</code></>,
           'Thứ tự nút, biểu tượng và liên kết phân quyền được thống nhất qua preset'],
        ]}
      />

      <Note title="Nếu cần thông báo lỗi riêng cho màn hình">
        Truyền <code>{'{ skipErrorToast: true }'}</code> vào yêu cầu và xử lý trong <code>onError</code>.
      </Note>
    </>
  ),

  perm: (
    <>
      <p className={styles.lead}>
        Quyền được xác định bởi <code>MENU_ROLE_MPNG.MENU_AUTHRT</code>.
        <b> Người dùng chỉ có quyền đọc thì không được bấm nút Lưu.</b>
      </p>

      <DataTable
        head={['Giá trị', 'Ý nghĩa', 'canRead', 'canWrite']}
        rows={[
          [<code>RD</code>, 'Đọc', 'O', 'X'],
          [<code>WT</code>, 'Ghi (bao gồm đọc)', 'O', 'O'],
          [<code>AL</code>, 'Toàn quyền', 'O', 'O'],
        ]}
      />

      <Code locale={L}>{CODE_PERM}</Code>

      <Note title="Vô hiệu hoá, đừng ẩn đi.">
        Nút biến mất khiến người dùng không hiểu vì sao. Nút xám cho thấy rõ đây là vấn đề quyền.
      </Note>

      <Note type="danger" title="Chặn ở màn hình không phải là kiểm tra quyền.">
        Có thể vượt qua dễ dàng từ trình duyệt. <b>API ghi ở máy chủ cũng phải gọi</b>
        <code> permissionGuard.assertMenuWrite(authentication, &quot;mã menu&quot;)</code>.
      </Note>
    </>
  ),

  label: (
    <>
      <p className={styles.lead}>
        Chữ trên màn hình lấy từ <b>nhãn trong DB</b>, không viết cứng trong mã.
        Để nguyên tiếng Hàn thì đổi ngôn ngữ vẫn ra tiếng Hàn.
      </p>

      <Code locale={L}>{CODE_LABEL}</Code>

      <DataTable
        head={['Hàm', 'Dạng khoá', 'Dùng cho']}
        rows={[
          [<code>tvt</code>, <code>VIEW.TEXT_</code>, 'Nhãn trường và hạng mục'],
          [<code>tvb</code>, <code>VIEW.BTN_</code>, 'Nút'],
          [<code>tvh</code>, <code>VIEW.TITLE_</code>, 'Tiêu đề vùng và bảng'],
          [<code>tsg</code>, <code>SCRIPT.GRID_</code>, 'Tiêu đề cột lưới'],
          [<code>tsm</code>, <code>SCRIPT.MSG_</code>, 'Thông báo riêng của màn hình này'],
          [<code>tmc / tmi / tme</code>, <code>MESSAGE.*</code>, 'Xác nhận / thông tin / lỗi toàn cục'],
        ]}
      />

      <h4>Đăng ký nhãn</h4>
      <p>
        Đăng ký tại màn hình
        <span className={styles.path}>Quản lý vận hành hệ thống &gt; Quản lý nhãn đa ngôn ngữ</span>.
        Nhập mã màn hình, phân loại và mã chi tiết thì mã nhãn sẽ được ghép tự động;
        nhập bản dịch từng ngôn ngữ ở lưới bên phải.
      </p>

      <Note title="Tham số thứ hai là giá trị dự phòng.">
        Truyền văn bản mặc định như <code>tvt(&apos;ntcTtl&apos;, &apos;제목&apos;)</code> thì màn hình vẫn hoạt động
        bình thường ngay cả khi nhãn chưa có.
        <b> Trong lúc phát triển hãy dùng giá trị dự phòng, đến khi màn hình chốt thì đăng ký nhãn một lượt</b> —
        cách này thường tiện hơn. Thông báo toàn cục (<code>tmc/tmi/tme</code>) không có dự phòng: chưa đăng ký
        thì khoá sẽ hiện nguyên văn.
      </Note>
    </>
  ),

  state: (
    <>
      <p className={styles.lead}>
        Hãy quyết định nơi đặt trạng thái bằng cách <b>chia thành ba nhánh</b>. Hai nhánh đầu bao phủ gần hết.
      </p>

      <DataTable
        head={['Cái gì', 'Đặt ở đâu', 'Ví dụ']}
        rows={[
          ['Dữ liệu lấy từ máy chủ', <b>React Query</b>, 'Danh sách, chi tiết, mã dùng chung'],
          ['Giá trị chỉ màn hình này dùng', <b>useState</b>, 'Dòng đang chọn, ô tìm kiếm, thu gọn biểu mẫu'],
          ['Chia sẻ ra ngoài màn hình', <b>Zustand</b>, 'Thông tin đăng nhập, tab, giao diện, nhãn'],
        ]}
      />

      <Code locale={L}>{CODE_STATE}</Code>

      <Note type="danger" title="Đừng đặt dữ liệu máy chủ vào Zustand.">
        Bạn sẽ phải tự quản lý bộ đệm, truy vấn lại và trạng thái tải; chỉ cần quên làm mới một lần sau khi lưu là
        <b> mỗi màn hình hiển thị dữ liệu khác nhau.</b> Dữ liệu từ máy chủ hãy giao cho React Query.
      </Note>

      <h4>Các store đã có sẵn</h4>
      <p>Hãy xem danh sách này trước khi tạo store mới.</p>
      <DataTable
        head={['Store', 'Chứa gì']}
        rows={[
          [<code>authStore</code>, 'Token, người dùng, vai trò'],
          [<code>tabStore</code>, 'Danh sách tab đang mở'],
          [<code>menuStore</code>, 'Thanh rail/flyout, menu từ máy chủ'],
          [<code>labelStore</code>, 'Bộ đệm nhãn đa ngôn ngữ'],
          [<code>comcdStore</code>, 'Bộ đệm mã dùng chung'],
          [<><code>localeStore</code> / <code>themeStore</code></>, 'Ngôn ngữ, chế độ tối'],
        ]}
      />
    </>
  ),

  check: (
    <>
      <p className={styles.lead}>Rà lại danh sách này trước khi commit.</p>

      <ul className={styles.checklist}>
        <li>Bấm menu thì mở tab và hiển thị màn hình</li>
        <li>Tên thư mục = <code>MENU_URL_ADDR</code> = tiền tố khoá nhãn, cả ba giống nhau</li>
        <li>Hàm API nằm dưới <code>src/api/</code> và có chuyển đổi <code>status → success</code></li>
        <li>Điều kiện tìm kiếm được gửi lên máy chủ (không <code>filter()</code> trên màn hình)</li>
        <li>Sau khi lưu và xoá, danh sách được làm mới bằng <code>invalidateQueries</code></li>
        <li>Không có toast lỗi bị lặp do <code>onError</code></li>
        <li>Nút ghi được ràng buộc bằng <code>canWrite</code> và máy chủ cũng kiểm tra quyền</li>
        <li>Chữ trên màn hình đi qua <code>useScreenLabel</code> (không viết cứng tiếng Hàn)</li>
        <li>Bố cục dùng <code>page-body</code> và <code>SplitPanel</code> (không tự viết flex)</li>
        <li><code>npx tsc -b</code> và <code>npm run lint</code> đều qua
          <b>(<code>--noEmit</code> ở đây không kiểm tra gì cả)</b></li>
      </ul>

      <Note title="Khi bí thì xem ở đâu">
        Hai màn hình đã hoàn thiện là tài liệu tham chiếu —
        <span className={styles.path}>src/features/sys/SYS030101SC</span> (một lưới + biểu mẫu) và
        <span className={styles.path}>src/features/sys/SYS050301SC</span> (chia đôi + CRUD).
        Props của các thành phần chung có trong những màn hình demo ở mục <b>Công cụ phát triển</b> bên trái.
      </Note>
    </>
  ),
};
