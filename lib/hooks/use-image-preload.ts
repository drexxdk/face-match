import { useEffect } from 'react';

/**
 * Preloads images by creating Image objects in the browser
 * @param urls Array of image URLs to preload
 */
export function useImagePreload(urls: (string | null | undefined)[]) {
  useEffect(() => {
    const validUrls = urls.filter((url): url is string => Boolean(url));

    if (validUrls.length === 0) return;

    const images: HTMLImageElement[] = [];

    validUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      images.push(img);
    });

    // Cleanup function
    return () => {
      images.forEach((img) => {
        img.src = '';
      });
    };
  }, [urls]);
}

/**
 * Preloads the next question's images
 * @param currentIndex Current question index
 * @param questions Array of questions
 */
export function useGameImagePreload<
  T extends { person: { image_url?: string | null }; options: Array<{ image_url?: string | null }> },
>(currentIndex: number, questions: T[]) {
  useEffect(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return;

    const nextQuestion = questions[nextIndex];
    const imagesToPreload: (string | null | undefined)[] = [
      nextQuestion.person.image_url,
      ...nextQuestion.options.map((opt) => opt.image_url),
    ];

    const validUrls = imagesToPreload.filter((url): url is string => Boolean(url));

    if (validUrls.length === 0) return;

    const images: HTMLImageElement[] = [];

    validUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      images.push(img);
    });

    // Cleanup
    return () => {
      images.forEach((img) => {
        img.src = '';
      });
    };
  }, [currentIndex, questions]);
}
