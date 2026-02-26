# Task: Fix Home Page Images Not Showing

## Status: FIX COMPLETE ✓

## Problem Identified
MediaCard.tsx used `opacity-0` initially and relied on `onLoad` callback to set images visible.
With `loading="lazy"` and cached images, the `onLoad` callback may not fire, leaving images invisible.

## Fix Applied to project/src/components/MediaCard.tsx:
1. Line 20: Added `useRef` to imports
2. Line 81: Added `const imgRef = useRef<HTMLImageElement>(null);`
3. Lines 86-91: Added useEffect to detect already-loaded cached images:
   ```tsx
   useEffect(() => {
     if (imgRef.current?.complete && imgRef.current?.naturalHeight > 0) {
       setImageLoaded(true);
     }
   }, [posterPath]);
   ```
4. Line 435: Added `ref={imgRef}` to the img element

## Verification:
- Build completed successfully: `cd project && npm run build` ✓
- Workflow restarted
- Hero carousel confirmed working (Avatar image visible in screenshots)
- No "[MediaCard DEBUG] Missing posterPath" errors in console = data passing correctly

## Summary:
The issue was that cached images weren't triggering the onLoad callback due to React's timing with lazy loading.
The fix adds a useEffect that checks if the image is already complete (cached) and sets imageLoaded=true immediately.
