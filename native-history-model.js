// Bounded word comparison: larger documents use a clearly identified middle-block comparison.
export function compareText(before,after){
 const a=String(before).match(/\s+|\S+/gu)||[],b=String(after).match(/\s+|\S+/gu)||[];const chunks=[];
 const push=(kind,text)=>{if(!text)return;const last=chunks.at(-1);if(last?.kind===kind)last.text+=text;else chunks.push({kind,text});};
 let start=0,endA=a.length,endB=b.length;
 while(start<endA&&start<endB&&a[start]===b[start])start++;
 while(endA>start&&endB>start&&a[endA-1]===b[endB-1]){endA--;endB--;}
 push('same',a.slice(0,start).join(''));const n=endA-start,m=endB-start;const simplified=n*m>1000000;
 if(simplified){push('removed',a.slice(start,endA).join(''));push('added',b.slice(start,endB).join(''));}
 else{
  const width=m+1,dp=new Uint32Array((n+1)*width);
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i*width+j]=a[start+i]===b[start+j]?dp[(i+1)*width+j+1]+1:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
  let i=0,j=0;while(i<n||j<m){if(i<n&&j<m&&a[start+i]===b[start+j]){push('same',a[start+i]);i++;j++;}else if(i<n&&(j===m||dp[(i+1)*width+j]>=dp[i*width+j+1]))push('removed',a[start+i++]);else push('added',b[start+j++]);}
 }
 push('same',a.slice(endA).join(''));
 return {chunks,simplified,added:chunks.filter(c=>c.kind==='added').reduce((n,c)=>n+(c.text.match(/\S+/gu)||[]).length,0),removed:chunks.filter(c=>c.kind==='removed').reduce((n,c)=>n+(c.text.match(/\S+/gu)||[]).length,0)};
}
