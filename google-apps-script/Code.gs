/**
 * ==============================================================================
 * PTI BEMP PHOTOBOOTH - GOOGLE DRIVE AUTO-SYNC WEBHOOK
 * ==============================================================================
 * 
 * DESKRIPSI:
 * Script ini berjalan pada Google Apps Script (script.google.com) sebagai Web App endpoint.
 * Menerima payload base64 gambar dari Photobooth dan menyimpannya secara otomatis ke
 * Folder Google Drive pameran, serta mengatur izin file menjadi publik.
 *
 * PANDUAN DEPLOYMENT KE GOOGLE APPS SCRIPT:
 * 1. Buka https://script.google.com di browser dan buat project baru ("PTI Photobooth Sync").
 * 2. Salin seluruh isi file ini dan tempelkan ke editor `Code.gs`.
 * 3. Ganti variabel `FOLDER_ID` di bawah dengan ID Folder Google Drive Anda.
 *    (ID Folder didapat dari URL Drive: https://drive.google.com/drive/folders/[FOLDER_ID])
 * 4. Klik menu "Deploy" > "New deployment".
 * 5. Pilih tipe "Web app".
 * 6. Konfigurasi:
 *    - Description: "PTI Photobooth Image Upload Webhook"
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (PENTING: Harus Anyone agar Next.js dapat mengirim data)
 * 7. Klik "Deploy", beri izin akses Google Drive saat diminta.
 * 8. Salin URL Web App yang dihasilkan (contoh: https://script.google.com/macros/s/.../exec).
 * 9. Simpan URL tersebut pada aplikasi Photobooth (atau set di localStorage 'pti_gas_webhook_url').
 * ==============================================================================
 */

// GANTI DENGAN ID FOLDER GOOGLE DRIVE ANDA
var FOLDER_ID = "1aBcD_CONTOH_FOLDER_ID_GOOGLE_DRIVE_ANDA";

/**
 * Handle HTTP POST Request dari Photobooth
 */
function doPost(e) {
  try {
    // 1. Parsing JSON Body
    var requestData;
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      requestData = e.parameter;
    } else {
      throw new Error("Payload request kosong atau tidak valid.");
    }

    var base64Data = requestData.image;
    var filename = requestData.filename || ("photo-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd-HHmmss") + ".jpg");

    if (!base64Data) {
      return createJsonResponse({
        success: false,
        error: "Parameter 'image' base64 diperlukan."
      }, 400);
    }

    // 2. Bersihkan header data URL (misal: "data:image/jpeg;base64,")
    var cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    // 3. Konversi Base64 menjadi Blob gambar
    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decodedBytes, "image/jpeg", filename);

    // 4. Dapatkan folder target Google Drive
    var folder;
    try {
      folder = DriveApp.getFolderById(FOLDER_ID);
    } catch (folderErr) {
      // Jika FOLDER_ID belum diubah, simpan di Root Drive sebagai fallback aman
      folder = DriveApp.getRootFolder();
    }

    // 5. Buat file baru di Google Drive
    var file = folder.createFile(blob);

    // 6. Set izin file agar dapat dilihat dan diunduh publik (Anyone with link can view)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 7. Ambil URL file
    var fileUrl = file.getUrl();
    var downloadUrl = "https://drive.google.com/uc?export=download&id=" + file.getId();

    // 8. Return response sukses
    return createJsonResponse({
      success: true,
      message: "Foto berhasil disimpan ke Google Drive.",
      id: file.getId(),
      filename: filename,
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      timestamp: new Date().toISOString()
    }, 200);

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString(),
      stack: error.stack
    }, 500);
  }
}

/**
 * Handle HTTP GET Request (Health check endpoint)
 */
function doGet(e) {
  return createJsonResponse({
    status: "online",
    service: "PTI BEMP Photobooth Google Drive Webhook",
    timestamp: new Date().toISOString()
  }, 200);
}

/**
 * Helper untuk membuat output HTTP JSON Response
 */
function createJsonResponse(data, statusCode) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
