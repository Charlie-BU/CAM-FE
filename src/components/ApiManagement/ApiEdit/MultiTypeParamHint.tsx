import { IconInfoCircle, Tooltip } from "@cloud-materials/common";

const hint = (
    <div style={{ maxWidth: 420, lineHeight: 1.6 }}>
        同个参数需要支持多个类型时，可新增同名参数并为每项选择不同类型；生成的 TypeScript
        字段会合并为联合类型<br />
        例如：<code>input: string | string[]</code><br />
        注意：同名参数的是否必填、可为 null 必须一致；描述、默认值和示例值必须相同，或仅其中一项有值（将采用有值的内容）。
    </div>
);

const MultiTypeParamHint = () => (
    <Tooltip content={hint}>
        <IconInfoCircle />
    </Tooltip>
);

export default MultiTypeParamHint;
