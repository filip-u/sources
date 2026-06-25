import svgPaths from "./svg-zivflzfhju";

function Attachments() {
  return (
    <div className="content-stretch flex gap-[8px] items-start overflow-clip relative shrink-0 w-full" data-name="Attachments">
      <div className="bg-[#f2f2f2] content-stretch flex gap-[8px] items-center overflow-clip pl-[4px] pr-[8px] py-[4px] relative rounded-[8px] shrink-0 w-[128px]" data-name="Attachment types">
        <div className="bg-[#5c6bc0] content-stretch flex items-center justify-center relative rounded-[4px] shrink-0 size-[40px]" data-name="Selection / Icons">
          <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icons/Actions/Description">
            <div className="absolute inset-[8.75%_17.08%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.8 19.8">
                <path clipRule="evenodd" d={svgPaths.p1ec74d80} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
        </div>
        <div className="[word-break:break-word] flex flex-col font-['Helvetica_Neue:Regular',sans-serif] justify-center leading-[0] not-italic overflow-hidden relative shrink-0 text-[#4f4f4f] text-[13px] text-ellipsis w-[66px] whitespace-nowrap">
          <p className="leading-[1.4] overflow-hidden text-ellipsis">Document</p>
        </div>
      </div>
    </div>
  );
}

function ExpandContainer() {
  return <div className="bg-white relative shrink-0 size-[32px]" data-name="Expand container" />;
}

function PromptSpace() {
  return (
    <div className="content-stretch flex gap-[8px] items-start max-h-[262px] min-h-[70px] overflow-clip relative shrink-0 w-[688px]" data-name="Prompt space">
      <div className="content-stretch flex flex-[1_0_0] items-start min-w-px relative" data-name="Text-prompt">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] min-w-px not-italic relative text-[#bdbdbd] text-[16px]">|A course teaching the topic step-by-step with lessons, examples, and exercises</p>
      </div>
      <ExpandContainer />
    </div>
  );
}

function AttachmentsPrompt() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start max-h-[262px] overflow-clip relative shrink-0 w-[688px]" data-name="Attachments & prompt">
      <Attachments />
      <PromptSpace />
    </div>
  );
}

function AddSettings() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="add- settings">
      <div className="bg-white content-stretch flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Sources">
        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icons/Actions/Add-Create new">
          <div className="absolute inset-[17.08%]" data-name="Vector (Stroke)">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.1667 13.1667">
              <path clipRule="evenodd" d={svgPaths.p19150200} fill="var(--fill-0, #4F4F4F)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Settings">
        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icons/Actions/Customizable">
          <div className="absolute inset-[12.92%]" data-name="Vector (Stroke)">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8333 14.8333">
              <path clipRule="evenodd" d={svgPaths.p27bd7000} fill="var(--fill-0, #4F4F4F)" fillRule="evenodd" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-white content-stretch flex items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[32px]" data-name="Settings">
        <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icons/Automations/Learning programs">
          <div className="absolute inset-[12.91%_8.76%_12.92%_17.08%]" data-name="Vector (Stroke)">
            <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.8317 14.834">
              <path d={svgPaths.p3e39c00} fill="var(--fill-0, #4F4F4F)" id="Vector (Stroke)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Actions1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] gap-[8px] items-center min-w-px relative" data-name="Actions">
      <AddSettings />
    </div>
  );
}

function Frame() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[20px] top-1/2" data-name="Frame">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g clipPath="url(#clip0_1_2637)" id="Frame">
          <g id="Vector" />
          <path d={svgPaths.p50d4d00} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M5.41406 10H17.4974" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
        <defs>
          <clipPath id="clip0_1_2637">
            <rect fill="white" height="20" width="20" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[#029c91] overflow-clip relative rounded-[16px] shrink-0 size-[32px]">
      <Frame />
    </div>
  );
}

function Component() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="2">
      <div className="content-stretch flex items-center opacity-60 relative shrink-0" data-name="Button / Send">
        <Frame1 />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <Component />
    </div>
  );
}

function Actions() {
  return (
    <div className="content-stretch flex items-end justify-between relative shrink-0 w-full" data-name="Actions">
      <Actions1 />
      <Frame3 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <AttachmentsPrompt />
      <Actions />
    </div>
  );
}

export default function BiglinePrompt() {
  return (
    <div className="bg-white relative rounded-[16px] size-full" data-name="Bigline / Prompt">
      <div className="content-stretch flex flex-col gap-[2px] items-start max-h-[inherit] min-h-[inherit] overflow-clip pb-[8px] pt-[16px] px-[16px] relative rounded-[inherit] size-full">
        <Frame2 />
        <div className="absolute bg-white content-stretch flex items-center justify-center p-[8px] right-[16px] rounded-[8px] size-[32px] top-[16px]" data-name="Close">
          <div className="overflow-clip relative shrink-0 size-[20px]" data-name="Icons/Actions/Close">
            <div className="absolute inset-[21.25%]" data-name="Vector (Stroke)">
              <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.5 11.5">
                <path clipRule="evenodd" d={svgPaths.p1467e300} fill="var(--fill-0, #4F4F4F)" fillRule="evenodd" id="Vector (Stroke)" />
              </svg>
            </div>
          </div>
        </div>
        <p className="[word-break:break-word] font-['Helvetica_Neue:Regular',sans-serif] leading-[1.4] not-italic relative shrink-0 text-[#828282] text-[10px] tracking-[0.4px] whitespace-nowrap">Currently in Beta</p>
      </div>
      <div aria-hidden className="absolute border border-[#e0e0e0] border-solid inset-[-1px] pointer-events-none rounded-[17px] shadow-[0px_0px_32px_0px_rgba(0,0,0,0.16)]" />
    </div>
  );
}