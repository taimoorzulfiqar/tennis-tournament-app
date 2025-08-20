const dns = require('dns').promises

async function verifyDomain(domain) {
  console.log(`🔍 Verifying domain: ${domain}`)
  
  try {
    // Check A record
    console.log('\n📋 Checking A record...')
    const aRecords = await dns.resolve4(domain)
    console.log('✅ A records found:', aRecords)
    
    // Check CNAME record
    console.log('\n📋 Checking CNAME record...')
    try {
      const cnameRecords = await dns.resolveCname(domain)
      console.log('✅ CNAME records found:', cnameRecords)
    } catch (error) {
      console.log('ℹ️  No CNAME record found (this is normal for root domains)')
    }
    
    // Check if domain resolves to Vercel
    console.log('\n📋 Checking if domain points to Vercel...')
    const isVercel = aRecords.some(ip => 
      ip === '76.76.19.34' || 
      ip === '76.76.21.34' ||
      ip === '76.76.20.34'
    )
    
    if (isVercel) {
      console.log('✅ Domain is pointing to Vercel!')
    } else {
      console.log('⚠️  Domain is not pointing to Vercel IPs')
      console.log('Expected IPs: 76.76.19.34, 76.76.21.34, 76.76.20.34')
    }
    
  } catch (error) {
    console.error('❌ Error verifying domain:', error.message)
  }
}

// If running directly, expect domain as command line argument
if (require.main === module) {
  const domain = process.argv[2]
  if (!domain) {
    console.error('Please provide a domain as an argument')
    console.log('Usage: node scripts/verify-domain.js yourdomain.com')
    process.exit(1)
  }
  
  verifyDomain(domain)
    .then(() => {
      console.log('\n🎉 Domain verification completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Domain verification failed:', error)
      process.exit(1)
    })
}

module.exports = { verifyDomain }
