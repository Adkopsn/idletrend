import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const SNAPSHOTS_DIRECTORY = path.resolve(
  "poc",
  "snapshots"
);

const MIN_FETCH_INTERVAL_MS =
  3 * 60 * 60 * 1000;

function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [scriptPath],
      {
        stdio: "inherit",
        shell: false,
      }
    );

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${scriptPath} hata koduyla kapandı: ${code}`
          )
        );
      }
    });
  });
}

function getSnapshotDate(filename) {
  const prefix = "steam-items-";
  const suffix = ".json";

  if (
    !filename.startsWith(prefix) ||
    !filename.endsWith(suffix)
  ) {
    return null;
  }

  const timestampText = filename
    .slice(prefix.length, -suffix.length)
    .replace(
      /^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2}\.\d{3}Z)$/,
      "$1:$2:$3"
    );

  const snapshotDate = new Date(timestampText);

  if (Number.isNaN(snapshotDate.getTime())) {
    return null;
  }

  return snapshotDate;
}

async function getLatestSnapshot() {
  const files = await readdir(
    SNAPSHOTS_DIRECTORY
  );

  const snapshots = files
    .map((filename) => ({
      filename,
      date: getSnapshotDate(filename),
    }))
    .filter(
      (snapshot) => snapshot.date !== null
    )
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime()
    );

  return snapshots[0] ?? null;
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.max(
    Math.floor(milliseconds / 60_000),
    0
  );

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} saat ${minutes} dakika`;
  }

  return `${minutes} dakika`;
}

try {
  const latestSnapshot =
    await getLatestSnapshot();

  let shouldFetch = true;

  if (latestSnapshot) {
    const snapshotAge =
      Date.now() -
      latestSnapshot.date.getTime();

    const remainingTime =
      MIN_FETCH_INTERVAL_MS -
      snapshotAge;

    console.log(
      `\nEn güncel snapshot: ${latestSnapshot.filename}`
    );

    console.log(
      `Snapshot yaşı: ${formatDuration(snapshotAge)}`
    );

    if (snapshotAge < MIN_FETCH_INTERVAL_MS) {
      shouldFetch = false;

      console.log(
        "\nSon snapshot 3 saatten daha yeni."
      );

      console.log(
        `Steam fetch işlemi atlanıyor. ` +
          `Yaklaşık ${formatDuration(
            remainingTime
          )} sonra yeniden veri çekilebilir.`
      );
    }
  } else {
    console.log(
      "\nMevcut snapshot bulunamadı."
    );

    console.log(
      "Yeni piyasa verisi çekilecek."
    );
  }

  if (shouldFetch) {
    console.log(
      "\n1/3 Güncel piyasa verisi çekiliyor...\n"
    );

    await runScript(
      "./poc/steam-market-fetcher.mjs"
    );
  } else {
    console.log(
      "\n1/3 Veri çekme adımı güvenlik nedeniyle atlandı."
    );
  }

  console.log(
    "\n2/3 Snapshotlar karşılaştırılıyor...\n"
  );

  await runScript(
    "./poc/compare-snapshots.mjs"
  );

  console.log(
    "\n3/3 Veriler PostgreSQL'e aktarılıyor...\n"
  );

  await runScript(
    "./poc/import-to-db.mjs"
  );

  console.log(
    "\nAnaliz ve veritabanı aktarımı başarıyla tamamlandı."
  );
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  console.error(
    "\nİşlem başarısız:",
    message
  );

  process.exitCode = 1;
}