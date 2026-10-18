import { type ImgHTMLAttributes, useEffect, useRef } from 'react';

export interface FilePreviewImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src'
> {
  file: File;
}

// 업로드 전 사진 미리보기. 파일을 가리키는 임시 주소를 만들어 보여주고,
// 사진이 바뀌거나 사라질 때 해제한다. 개발 모드에서 effect가 두 번 실행돼도
// 매번 새 주소를 만들도록 state 대신 ref로 src를 넣는다
export const FilePreviewImage = ({
  alt = '',
  file,
  ...props
}: FilePreviewImageProps) => {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current) {
      return;
    }

    const url = URL.createObjectURL(file);
    imageRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <img alt={alt} ref={imageRef} {...props} />;
};
