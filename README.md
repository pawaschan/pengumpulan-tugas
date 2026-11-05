# Daftar Tugas Kuliah
Aplikasi web sederhana (TypeScript + Vite) untuk mengelola tugas kuliah.

## Menjalankan
```bash
npm install
cp .env.example .env   # lalu sesuaikan isinya
npm run dev            # mode pengembangan
npm run build          # build ke folder dist/
npm run preview        # coba hasil build
```

## Alur Git (untuk tugas)
```bash
git init
git add . && git commit -m "chore: inisialisasi proyek Vite + TS"
git branch -M main
git remote add origin https://github.com/USERNAME/todo-kuliah.git
git push -u origin main

# branch 1
git checkout -b fitur-tambah-tugas
# ...ubah kode...  git commit -am "feat: ..."
git push -u origin fitur-tambah-tugas
# buka Pull Request di GitHub, lalu merge

# branch 2 + simulasi merge conflict
git checkout main && git pull
git checkout -b fitur-style
# ubah baris yang SAMA dengan branch lain, commit
git checkout main && git merge fitur-style   # selesaikan conflict -> git add . -> git commit
git push
```
