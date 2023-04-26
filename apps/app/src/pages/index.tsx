import { useForm } from 'react-hook-form';
import { FieldFileUpload } from '../components/forms/field-file-upload';

type Inputs = {
  file: FileList;
};

export const HomePage: React.FC = () => {
  const { control, watch } = useForm<Inputs>();
  const file = watch('file');

  console.log(file);
  return (
    <FieldFileUpload
      controlProps={{ control, name: 'file' }}
      label='Choose a document'
    />
  );
};
