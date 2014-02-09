
backup_dir="."
backup_files="config.js imakes.db.bak files"
backup_dest=".."

date=$(date +%Y-%m-%d)
archive_file="imakes-$date.tgz"

echo "Backing up $backup_files to $backup_dest/$archive_file"
date
echo
sqlite3 $backup_dir/imakes.db ".backup $backup_dir/imakes.db.bak"
tar czf $backup_dest/$archive_file -C $backup_dir $backup_files
rm $backup_dir/imakes.db.bak
echo
echo "Backup finished"
