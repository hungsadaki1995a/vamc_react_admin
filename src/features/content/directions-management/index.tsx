import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImageOutlined } from '@ant-design/icons';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import TextInput from '@/components/inputs/TextInput';
import { useMenuPermission } from '@/hooks/use-menu-permission';
import { useNotify } from '@/hooks/use-notify';
import type { AboutDirections, AboutDirectionsRequest } from '@/api/contents/about-page-api';
import { SysButton, SysPage, SysTitleBar } from '@/components/common/sys-ui/SysListUi';
import { SysField, SysFieldGrid } from '@/components/common/sys-ui/SysFormUi';
import { SYS_MESSAGES } from '@/config/sys-messages';
import { errorMessage } from '@/utils/system-utils';
import { useFieldErrors } from '@/hooks/use-field-errors';
import { useAboutDirections, useSaveAboutDirections } from './use-directions';
import styles from './directions-management.module.scss';

// Directions Management (VPA07100301): address, map, contact and business hours of user About > Directions.
// EN values fall back to VN on the user EN screen; empty closed days are not shown there.
// [Find Location] shows the entered location on Google Maps (1 pin); "latitude,longitude" also moves the user map pin.

const TITLE = 'Directions Management';
const BREADCRUMB = ['Content Management', 'About VAMC Management', TITLE];

type FieldKey = keyof AboutDirectionsRequest;
type FormState = Record<FieldKey, string>;

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: 'addressVn', label: 'Address (VN)', required: true },
  { key: 'addressEn', label: 'Address (EN)' },
  { key: 'mapLocation', label: 'Map Location', required: true },
  { key: 'phone', label: 'Phone', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'businessHoursVn', label: 'Business Hours (VN)', required: true },
  { key: 'businessHoursEn', label: 'Business Hours (EN)' },
  { key: 'closedDaysVn', label: 'Closed Days (VN)' },
  { key: 'closedDaysEn', label: 'Closed Days (EN)' },
];
const FIELD_BY_KEY = Object.fromEntries(FIELDS.map((f) => [f.key, f])) as Record<FieldKey, (typeof FIELDS)[number]>;
const MAX_LENGTH: Record<FieldKey, number> = {
  addressVn: 500,
  addressEn: 500,
  mapLocation: 256,
  phone: 50,
  email: 256,
  businessHoursVn: 200,
  businessHoursEn: 200,
  closedDaysVn: 200,
  closedDaysEn: 200,
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toState(d: AboutDirections): FormState {
  return {
    addressVn: d.addressVn ?? '',
    addressEn: d.addressEn ?? '',
    mapLocation: d.mapLocation ?? d.coordinates ?? '',
    phone: d.phone ?? '',
    email: d.email ?? '',
    businessHoursVn: d.businessHoursVn ?? '',
    businessHoursEn: d.businessHoursEn ?? '',
    closedDaysVn: d.closedDaysVn ?? '',
    closedDaysEn: d.closedDaysEn ?? '',
  };
}

function toRequest(values: FormState): AboutDirectionsRequest {
  const optional = (v: string) => v.trim() || undefined;
  return {
    addressVn: values.addressVn.trim(),
    addressEn: optional(values.addressEn),
    mapLocation: values.mapLocation.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    businessHoursVn: values.businessHoursVn.trim(),
    businessHoursEn: optional(values.businessHoursEn),
    closedDaysVn: optional(values.closedDaysVn),
    closedDaysEn: optional(values.closedDaysEn),
  };
}

/** Google Maps embed (no API key) centred on the query with one pin. */
function mapEmbedUrl(query: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

export default function DirectionsManagement() {
  const { t } = useTranslation();
  const { data, isFetching, isError } = useAboutDirections();

  return (
    <SysPage>
      <SysTitleBar title={TITLE} breadcrumb={BREADCRUMB} />
      {data ? (
        <DirectionsForm key={data.pstNo ?? 'new'} directions={data} />
      ) : (
        <LoadingSpinner spinning={isFetching}>
          <div className={styles.loading}>{isError ? t('messages.content.directions.loadFailed') : null}</div>
        </LoadingSpinner>
      )}
    </SysPage>
  );
}

function DirectionsForm({ directions }: { directions: AboutDirections }) {
  const { t } = useTranslation();
  const { canWrite } = useMenuPermission();
  const { toast } = useNotify();
  const save = useSaveAboutDirections();
  const { errors, setError, clearError, clearAll, applyApiError } = useFieldErrors<FieldKey>();
  const [values, setValues] = useState<FormState>(() => toState(directions));
  // Location shown in the preview; set on load and by [Find Location]
  const [mapQuery, setMapQuery] = useState(() => toState(directions).mapLocation.trim());

  const patch = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const findLocation = () => {
    const query = values.mapLocation.trim() || values.addressVn.trim();
    if (!query) {
      setError('mapLocation', t('messages.content.directions.mapLocationRequired'));
      return;
    }
    setMapQuery(query);
  };

  const validate = (): boolean => {
    clearAll();
    let valid = true;
    FIELDS.forEach(({ key, label, required }) => {
      if (required && !values[key].trim()) {
        setError(key, t('messages.sys.fieldRequired', { label }));
        valid = false;
      }
    });
    if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
      setError('email', t('messages.content.directions.emailInvalid'));
      valid = false;
    }
    return valid;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      await save.mutateAsync(toRequest(values));
      toast.success(SYS_MESSAGES.saved);
    } catch (error) {
      if (!applyApiError(error)) toast.error(errorMessage(error));
    }
  };

  const input = (key: FieldKey, label: string) => (
    <TextInput
      aria-label={label}
      value={values[key]}
      maxLength={MAX_LENGTH[key]}
      disabled={!canWrite}
      onChange={(e) => patch(key, e.target.value)}
    />
  );

  const field = (key: FieldKey) => {
    const { label, required } = FIELD_BY_KEY[key];
    return (
      <SysField key={key} label={label} required={required} error={errors[key]}>
        {input(key, label)}
      </SysField>
    );
  };

  return (
    <>
      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <SysFieldGrid columns={1} labelWidth={150}>
          {field('addressVn')}
          {field('addressEn')}
          <SysField label="Map Location" required error={errors.mapLocation}>
            {input('mapLocation', 'Map Location')}
            {canWrite && <SysButton onClick={findLocation}>Find Location</SysButton>}
          </SysField>
          <SysField label="Map Preview">
            <div className={styles.mapPreview}>
              {mapQuery ? (
                <iframe
                  className={styles.mapFrame}
                  title="Google Map preview"
                  src={mapEmbedUrl(mapQuery)}
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className={styles.mapEmpty}>
                  <FileImageOutlined className={styles.mapEmptyIcon} />
                  <span>Google Map preview (1 pin)</span>
                </div>
              )}
            </div>
          </SysField>
          {field('phone')}
          {field('email')}
          {field('businessHoursVn')}
          {field('businessHoursEn')}
          {field('closedDaysVn')}
          {field('closedDaysEn')}
        </SysFieldGrid>
      </form>
      {canWrite && (
        <div className={styles.footer}>
          <SysButton look="primary" loading={save.isPending} onClick={submit}>
            Save
          </SysButton>
        </div>
      )}
    </>
  );
}
