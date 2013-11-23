
backup_dir="."
backup_files="config.js imakes.db files"
backup_dest=".."

date=$(date +%Y-%m-%d)
archive_file="imakes-$date.tgz"

echo "Backing up $backup_files to $backup_dest/$archive_file"
date
echo
tar czf $backup_dest/$archive_file -C $backup_dir $backup_files
echo
echo "Backup finished"
