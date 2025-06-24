import os
import re
import requests
import hashlib
from urllib.parse import urlparse
from bs4 import BeautifulSoup
from threading import Thread
import queue

def _threaded_downloader(url, headers, q):
    """Worker function to be run in a thread.
    Downloads URL content. Puts a (content, content_type) tuple or Exception in the queue.
    """
    try:
        # This get is non-streaming. Timeout is for socket reads between bytes, a good failsafe.
        response = requests.get(url, timeout=20, headers=headers)
        response.raise_for_status()
        q.put((response.content, response.headers.get('content-type')))
    except Exception as e:
        q.put(e)

def sanitize_filename(url):
    ""'URL에서 파일명으로 사용하기 안전한 문자열을 생성합니다.""'
    # 해시를 사용하여 고유성을 보장하고 길이를 줄입니다.
    url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
    # URL에서 마지막 부분을 가져와서 대략적인 파일 종류를 알 수 있도록 합니다.
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.split('/')
    if path_parts:
        last_part = path_parts[-1]
        _, extension = os.path.splitext(last_part)
        if extension:
             # 파일 확장자가 2~5글자인 경우만 사용
            if 2 <= len(extension) <= 5:
                 return f"{url_hash}{extension}"

    # 확장자를 찾지 못한 경우, Content-Type을 확인해야 하지만,
    # 여기서는 간단히 hash만 사용하거나 기본 확장자를 가정합니다.
    # 우선은 확장자 없이 해시값만 반환합니다.
    # 실제 다운로드 후 Content-Type으로 확장자를 결정하는 것이 더 정확합니다.
    return url_hash

def download_image(url, folder_path):
    ""'주어진 URL의 이미지를 지정된 폴더에 다운로드하고, 성공 시 파일명, 실패 시 오류 이유를 반환합니다.""'
    timeout_seconds = 10  # 10초 이상 걸리면 타임아웃
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    try:
        q = queue.Queue()
        headers = {
            'User-Agent': 'CguslabResourceDownloader/1.3 (threaded)'
        }
        thread = Thread(target=_threaded_downloader, args=(url, headers, q))
        thread.daemon = True
        thread.start()

        # q.get() provides the total-time timeout for the download.
        result = q.get(timeout=timeout_seconds)

        if isinstance(result, Exception):
            raise result # Re-raise exception from the thread

        content, content_type = result
        
        extension = ''
        if content_type:
            if 'jpeg' in content_type or 'jpg' in content_type:
                extension = '.jpg'
            elif 'png' in content_type:
                extension = '.png'
            elif 'gif' in content_type:
                extension = '.gif'
            elif 'webp' in content_type:
                extension = '.webp'
            elif 'svg' in content_type:
                extension = '.svg'

        filename_base = sanitize_filename(url)
        if not os.path.splitext(filename_base)[1]:
             filename = filename_base + extension
        else:
             filename = filename_base

        filepath = os.path.join(folder_path, filename)

        if os.path.exists(filepath):
            print(f"  이미 존재함: {filename}")
            return filename, None

        with open(filepath, 'wb') as f:
            f.write(content)

        print(f"  다운로드 완료: {filename}")
        return filename, None

    except queue.Empty:
        reason = f"이유: 요청 시간 초과 ({timeout_seconds}초)"
        print(f"  [오류] 다운로드 실패 (시간 초과): {url}")
        return None, reason
    except Exception as e:
        reason = f"이유: {e}"
        print(f"  [오류] 다운로드 실패: {url}, {reason}")
        return None, reason

def process_html_file(filepath, resources_folder):
    ""'HTML 파일을 처리하고, 발생한 다운로드 오류 목록을 반환합니다.""'
    print(f"\n파일 처리 중: {filepath}")
    errors = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f, 'html.parser')

        images = soup.find_all('img')
        file_modified = False
        external_images_found = 0

        for img in images:
            src = img.get('src')
            if src and src.startswith(('http://', 'https://')):
                external_images_found += 1
                print(f"  외부 이미지 발견: {src}")
                
                local_filename, reason = download_image(src, resources_folder)

                if local_filename:
                    html_dir = os.path.dirname(filepath)
                    relative_path = os.path.relpath(os.path.join(resources_folder, local_filename), html_dir)
                    relative_path = relative_path.replace('\\', '/')
                    
                    if img['src'] != relative_path:
                        print(f"  경로 변경: {src} -> {relative_path}")
                        img['src'] = relative_path
                        file_modified = True
                else:
                    errors.append({'url': src, 'reason': reason})

        if file_modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(str(soup))
            print(f"  파일 업데이트 완료: {os.path.basename(filepath)}")
        elif external_images_found > 0:
            print(f"  외부 이미지 {external_images_found}개를 찾았으나, 다운로드에 실패하여 파일을 업데이트하지 않았습니다.")
        else:
            print("  업데이트할 외부 이미지가 없습니다.")

    except Exception as e:
        print(f"  [오류] 파일 처리 실패: {filepath}, 이유: {e}")
    
    return errors


def main():
    ""'메인 실행 함수""'
    root_dir = os.getcwd()
    lecture_dirs = [d for d in os.listdir(root_dir) if os.path.isdir(d) and d.startswith('lighting-lecture-')]
    all_download_errors = []

    for lecture_dir in lecture_dirs:
        lecture_path = os.path.join(root_dir, lecture_dir)
        html_folder = os.path.join(lecture_path, 'html')
        resources_folder = os.path.join(lecture_path, 'resources')
        
        print(f"--- 강의 폴더 처리 시작: {lecture_dir} ---")

        if not os.path.isdir(html_folder):
            print(f"  'html' 폴더를 찾을 수 없습니다. 건너뜁니다.")
            continue
            
        if not os.path.exists(resources_folder):
            print(f"  'resources' 폴더 생성: {resources_folder}")
            os.makedirs(resources_folder)

        for filename in os.listdir(html_folder):
            if filename.endswith('.html'):
                html_filepath = os.path.join(html_folder, filename)
                errors = process_html_file(html_filepath, resources_folder)
                
                if errors:
                    for error in errors:
                        slide_num_str = os.path.splitext(filename)[0].replace('s', '')
                        location_info = f"강의: {lecture_dir}, 슬라이드: {slide_num_str}"
                        all_download_errors.append({
                            'url': error['url'],
                            'reason': error['reason'],
                            'location': location_info
                        })

    if all_download_errors:
        log_filepath = 'download_errors.log'
        print(f"\n--- 다운로드 오류 발생, '{log_filepath}' 파일에 로그를 저장합니다. ---")
        with open(log_filepath, 'w', encoding='utf-8') as f:
            # 중복된 오류를 제거하고 기록하기 위해 set 사용
            unique_errors = {f"{err['url']}|{err['location']}" : err for err in all_download_errors}
            for err in sorted(unique_errors.values(), key=lambda x: x['location']):
                f.write(f"[오류] 다운로드 실패: {err['url']}, {err['reason']}\n")
                f.write(f"  - 위치: {err['location']}\n")
    
    print("\n--- 모든 작업이 완료되었습니다. ---")

if __name__ == "__main__":
    try:
        import requests
        import bs4
    except ImportError:
        print("'requests'와 'beautifulsoup4' 라이브러리가 필요합니다.")
        print("스크립트를 실행하기 전에 'pip install requests beautifulsoup4' 명령을 실행해주세요.")
    else:
        # 기존 로그 파일이 있다면 삭제
        if os.path.exists('download_errors.log'):
            os.remove('download_errors.log')
        main() 