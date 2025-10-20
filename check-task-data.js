#!/usr/bin/env node

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@localhost:5432/default',
});

async function checkTaskData() {
  const client = await pool.connect();
  
  try {
    const workspace = 'workspace_1wgvd1injqtife6y4rvfbu3h5';
    
    console.log('=== 檢查 Task 數據 ===\n');
    
    // 查詢前 5 個 tasks
    const tasksResult = await client.query(`
      SELECT 
        id,
        title,
        "bodyV2Blocknote",
        "bodyV2Markdown",
        "createdAt",
        "updatedAt"
      FROM "${workspace}".task
      WHERE "deletedAt" IS NULL
      ORDER BY "updatedAt" DESC
      LIMIT 5
    `);
    
    console.log(`找到 ${tasksResult.rows.length} 個 Tasks\n`);
    
    for (let i = 0; i < tasksResult.rows.length; i++) {
      const task = tasksResult.rows[i];
      console.log(`\n【Task ${i + 1}】`);
      console.log(`ID: ${task.id}`);
      console.log(`Title: ${task.title || '(無標題)'}`);
      console.log(`Updated: ${task.updatedAt}`);
      
      // 檢查 bodyV2Blocknote
      if (task.bodyV2Blocknote) {
        console.log(`\nbodyV2Blocknote 長度: ${task.bodyV2Blocknote.length} 字符`);
        
        // 嘗試解析
        try {
          const parsed = JSON.parse(task.bodyV2Blocknote);
          console.log(`解析成功！類型: ${Array.isArray(parsed) ? 'Array' : typeof parsed}`);
          
          if (Array.isArray(parsed)) {
            console.log(`包含 ${parsed.length} 個 blocks`);
            
            // 檢查是否有重複的 ID
            const ids = [];
            const checkIds = (obj) => {
              if (obj && typeof obj === 'object') {
                if (obj.id) ids.push(obj.id);
                if (Array.isArray(obj)) {
                  obj.forEach(checkIds);
                } else {
                  Object.values(obj).forEach(checkIds);
                }
              }
            };
            
            checkIds(parsed);
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            
            if (duplicates.length > 0) {
              console.log(`⚠️  發現重複的 ID: ${[...new Set(duplicates)].join(', ')}`);
            } else {
              console.log(`✅ 沒有重複的 ID`);
            }
            
            // 檢查是否包含 "multiple-node"
            if (task.bodyV2Blocknote.includes('multiple-node')) {
              console.log(`⚠️  包含 "multiple-node" selection ID`);
            }
          }
          
          // 顯示前 200 個字符
          const preview = task.bodyV2Blocknote.substring(0, 200);
          console.log(`\n內容預覽:\n${preview}...`);
          
        } catch (e) {
          console.log(`❌ JSON 解析失敗: ${e.message}`);
          console.log(`內容預覽:\n${task.bodyV2Blocknote.substring(0, 200)}...`);
        }
      } else {
        console.log('\nbodyV2Blocknote: NULL');
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
  } catch (error) {
    console.error('\n❌ 錯誤:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTaskData().catch(console.error);

