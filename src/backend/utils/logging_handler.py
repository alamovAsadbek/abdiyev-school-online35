import os
from logging.handlers import TimedRotatingFileHandler


class SafeTimedRotatingFileHandler(TimedRotatingFileHandler):
    def rotate(self, source, dest):
        """
        Agar dest mavjud bo'lsa:
            app.log.2026-08-05
            app.log.2026-08-05.1
            app.log.2026-08-05.2
            ...
        """
        if os.path.exists(dest):
            i = 1
            while os.path.exists(f"{dest}.{i}"):
                i += 1
            dest = f"{dest}.{i}"

        os.rename(source, dest)