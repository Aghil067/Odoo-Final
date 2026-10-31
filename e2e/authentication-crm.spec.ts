import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const fixture=JSON.parse(readFileSync('.runtime/test-accounts.json','utf8'));
if(fixture.disposable!==true)throw new Error('Browser tests require the disposable test accounts');
async function login(page:Page,role='ADMIN'){
 await page.goto('/login');await page.getByLabel('Email address').fill(fixture.users[role].email);await page.getByLabel('Password',{exact:true}).fill(fixture.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);await expect(page.getByRole('heading',{name:'Dashboard & Analytics'})).toBeVisible();
}
test('real login restores the HttpOnly session after refresh and logout invalidates it',async({page,context})=>{
 await login(page);await expect(page.getByText('Database snapshot:')).toBeVisible();
 const cookie=(await context.cookies()).find(c=>c.name==='solar_session');expect(cookie?.httpOnly).toBe(true);expect(cookie?.sameSite).toBe('Lax');
 expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
 await page.reload();await expect(page.getByRole('heading',{name:'Dashboard & Analytics'})).toBeVisible();
 await page.getByRole('button',{name:'Log out',exact:true}).click();await expect(page).toHaveURL(/\/login$/);await page.goto('/crm/customers');await expect(page).toHaveURL(/\/login$/);
});
test('customer, site and lead persist through actual browser requests and refresh',async({page})=>{
 await login(page);const name='TEST ONLY Browser '+randomUUID();
 await page.goto('/crm/customers/new');await page.getByLabel('Full Name',{exact:false}).fill(name);await page.getByLabel(/^Phone Number/).fill('+14155552671');
 await page.getByRole('button',{name:/Save Customer|Register Customer|Create Customer/}).click();await expect(page).toHaveURL(/\/crm\/customers\/[a-f0-9-]{36}$/);await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
 const customerUrl=page.url();await page.getByRole('button',{name:'Add Site',exact:true}).click();await page.getByLabel('Site Name',{exact:false}).fill('TEST ONLY Rooftop');await page.getByLabel('Site Address',{exact:false}).fill('1 Synthetic Browser Test Street');await page.getByLabel('City',{exact:false}).fill('Test City');await page.getByLabel('State',{exact:false}).fill('Test State');await page.getByLabel('Postal Code',{exact:false}).fill('10001');await page.getByLabel('Country Code',{exact:false}).fill('US');await page.getByRole('button',{name:'Save Site',exact:true}).click();await expect(page.getByText('TEST ONLY Rooftop',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByText('TEST ONLY Rooftop',{exact:true})).toBeVisible();
 await page.goto('/crm/enquiries/new');await page.getByLabel('Customer',{exact:false}).selectOption({label:name});await page.getByLabel('Installation Site',{exact:false}).selectOption({label:'TEST ONLY Rooftop - Test City'});await page.getByLabel('System Type',{exact:false}).selectOption('on_grid');await page.getByLabel('Requested Capacity',{exact:false}).fill('3.125');await page.getByLabel('Qualification / Requirements Notes',{exact:false}).fill('TEST ONLY documented customer requirements');await page.getByRole('button',{name:'Save Enquiry',exact:true}).click();await expect(page).toHaveURL(/\/crm\/enquiries\/[a-f0-9-]{36}$/);const leadUrl=page.url();await page.reload();await expect(page.getByText(name,{exact:true}).first()).toBeVisible();
 await page.goto(customerUrl+'/edit');await page.getByLabel('Full Name',{exact:false}).fill(name+' Updated');await page.getByRole('button',{name:/Save Customer|Save Changes|Update Customer/}).click();await expect(page).toHaveURL(customerUrl);await page.reload();await expect(page.getByRole('heading',{name:name+' Updated',exact:true})).toBeVisible();
 await page.goto(leadUrl);await expect(page.getByText(name+' Updated',{exact:true}).first()).toBeVisible();
});
test('technician role cannot navigate to financial pages',async({page})=>{await login(page,'TECHNICIAN');await page.goto('/finance/invoices');await expect(page).toHaveURL(/\/unauthorized$/);});
test('network failure displays an explicit error instead of demo customers',async({page})=>{await login(page);await page.route('**/api/customers?*',route=>route.abort('failed'));await page.goto('/crm/customers');await expect(page.getByRole('alert').filter({hasText:'Cannot connect to the API'})).toBeVisible();});
