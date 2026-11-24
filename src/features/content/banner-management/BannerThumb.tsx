import { FileImageOutlined } from '@ant-design/icons';
import { useAttachmentPreview } from '../_shared/use-content-files';
import styles from './banner-management.module.scss';

// Banner image in a list cell (design: gray 160 × 45 frame); a gray icon while loading or without an image.

interface BannerThumbProps {
  fileUnqId?: string;
  alt: string;
}

export default function BannerThumb({ fileUnqId, alt }: BannerThumbProps) {
  const preview = useAttachmentPreview(fileUnqId);
  return (
    <span className={styles.thumb}>
      {preview ? <img src={preview} alt={alt} className={styles.thumbImage} /> : <FileImageOutlined className={styles.thumbIcon} />}
    </span>
  );
}
